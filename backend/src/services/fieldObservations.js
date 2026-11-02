import { MongoClient } from 'mongodb';
import { env } from '../config/env.js';

let clientPromise;
const collectionName = 'field_observations';

async function collection() {
  if (!env.mongoUri) {
    const error = new Error('MongoDB is not configured. Set MONGODB_URI to enable field observation details.');
    error.statusCode = 503;
    throw error;
  }
  if (!clientPromise) {
    const client = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      throw error;
    });
  }
  const client = await clientPromise;
  const observations = client.db(env.mongoDbName).collection(collectionName);
  await Promise.all([
    observations.createIndex({ mysqlSightingId: 1 }, { unique: true, name: 'uq_mysql_sighting' }),
    observations.createIndex({ regionId: 1, 'species.name': 1, observedAt: -1 }, { name: 'idx_region_species_time' }),
    observations.createIndex({ observedAt: -1 }, { name: 'idx_observed_at' }),
  ]);
  return observations;
}

export async function storeFieldObservation(document) {
  const observations = await collection();
  const result = await observations.insertOne({ ...document, createdAt: new Date() });
  return result.insertedId.toString();
}

export async function removeFieldObservation(mysqlSightingId) {
  const observations = await collection();
  await observations.deleteOne({ mysqlSightingId: Number(mysqlSightingId) });
}

export async function getFieldObservation(mysqlSightingId) {
  const observations = await collection();
  const document = await observations.findOne({ mysqlSightingId: Number(mysqlSightingId) });
  if (!document) return null;
  return { ...document, _id: document._id.toString() };
}

export async function aggregateFieldObservations(regionIds) {
  const observations = await collection();
  const match = regionIds ? { $match: { regionId: { $in: regionIds.map(Number) } } } : { $match: {} };
  const result = await observations.aggregate([
    match,
    { $facet: {
      bySpecies: [
        { $group: { _id: { $ifNull: ['$species.name', 'Unknown species'] }, count: { $sum: 1 } } },
        { $project: { _id: 0, species: '$_id', count: 1 } },
        { $sort: { count: -1, species: 1 } },
      ],
      byMonth: [
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$observedAt' } }, count: { $sum: 1 } } },
        { $project: { _id: 0, month: '$_id', count: 1 } },
        { $sort: { month: 1 } },
      ],
      byWeather: [
        { $match: { 'environment.weather': { $type: 'string', $ne: '' } } },
        { $group: { _id: '$environment.weather', count: { $sum: 1 } } },
        { $project: { _id: 0, weather: '$_id', count: 1 } },
        { $sort: { count: -1, weather: 1 } },
      ],
    } },
  ]).toArray();
  return result[0] || { bySpecies: [], byMonth: [], byWeather: [] };
}

export async function mongoStatus() {
  if (!env.mongoUri) return { available: false, configured: false, collection: collectionName };
  try {
    await collection();
    return { available: true, configured: true, database: env.mongoDbName, collection: collectionName };
  } catch {
    return { available: false, configured: true, database: env.mongoDbName, collection: collectionName };
  }
}
