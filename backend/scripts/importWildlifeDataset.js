import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { env } from '../src/config/env.js';
import { pool } from '../src/config/db.js';
import { getReviewedCommonName } from '../src/data/speciesCommonNames.js';
import { getSpeciesHabitat } from '../src/data/speciesHabitats.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.resolve(SCRIPT_DIR, '../data');
const DATASET_NAME = 'Mammal occurrence along line transects for hornbill survey in the Western Ghats, India (2005-06)';
const COLLECTION_NAME = 'field_observations';
const IMPORTER_EMAIL = process.env.DATASET_IMPORTER_EMAIL || 'wildlife-dataset-importer@wildlife.local';
const IMPORTER_NAME = 'Wildlife Dataset Importer';
const IMPORT_MARKER = '[Layer 1 dataset occurrence: ';

function optionsFromArgs(args) {
  const options = { apply: false, fullReport: false, dataDir: DEFAULT_DATA_DIR };
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--apply') options.apply = true;
    else if (args[index] === '--dry-run') options.apply = false;
    else if (args[index] === '--full-report') options.fullReport = true;
    else if (args[index] === '--data-dir' && args[index + 1]) options.dataDir = path.resolve(args[++index]);
    else if (args[index] === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${args[index]}`);
  }
  return options;
}

// Small RFC 4180 reader so the import does not depend on a new CSV package.
function parseCsv(text, fileName) {
  const records = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ',') { row.push(field); field = ''; }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some((value) => value.trim() !== '')) records.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error(`${fileName} contains an unterminated quoted field.`);
  if (field.length || row.length) { row.push(field); if (row.some((value) => value.trim() !== '')) records.push(row); }
  if (!records.length) throw new Error(`${fileName} is empty.`);
  const headers = records.shift().map((value, index) => (index === 0 ? value.replace(/^\uFEFF/, '') : value).trim());
  if (new Set(headers.map((header) => header.toLowerCase())).size !== headers.length) {
    throw new Error(`${fileName} contains duplicate column names.`);
  }
  return records.map((values, rowIndex) => {
    if (values.length > headers.length) throw new Error(`${fileName} row ${rowIndex + 2} has more fields than its header.`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
  });
}

const get = (row, ...names) => {
  for (const name of names) {
    const key = Object.keys(row).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
    const value = key ? String(row[key] ?? '').trim() : '';
    if (value) return value;
  }
  return '';
};
const occurrenceId = (row) => get(row, 'occurrenceID', 'occurrence_id')
  || (get(row, 'description').match(/(?:^|[;|])\s*Occurrence ID:\s*([^;|]+)\s*(?:[;|]|$)/i)?.[1]?.trim() || '');
const normalize = (value) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const taxonKey = (value) => String(value || '').match(/^([A-Z][a-z]+)\s+([a-z]+)/)?.slice(1).join(' ') || '';
const numberOrNull = (value) => value === '' ? null : Number(value);

function recordIdentity(row) {
  const id = occurrenceId(row);
  if (id) return `occurrence:${id}`;
  const scientificName = get(row, 'scientificName', 'scientific_name');
  const time = get(row, 'mysql_sighting_time', 'eventDate', 'sighting_time');
  const longitude = get(row, 'decimalLongitude', 'decimal_longitude', 'longitude');
  const latitude = get(row, 'decimalLatitude', 'decimal_latitude', 'latitude');
  if (!scientificName || !time || !longitude || !latitude) return '';
  return `composite:${normalize(scientificName)}|${time}|${longitude}|${latitude}`;
}

function stableOccurrenceKey(row, rowNumber) {
  const original = occurrenceId(row);
  if (original) return original;
  const fingerprint = createHash('sha256').update(`${recordIdentity(row)}|${get(row, 'locality')}|${rowNumber}`).digest('hex');
  return `generated:${fingerprint}`;
}

function dateTime(value) {
  const source = String(value || '').trim();
  if (!source) return null;
  const match = source.match(/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/i);
  if (!match) return null;
  if (!match[3]) return `${match[1]} ${match[2] || '00:00:00'}`;
  const parsed = new Date(source);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function coordinates(row) {
  let longitude = numberOrNull(get(row, 'decimalLongitude', 'decimal_longitude', 'longitude'));
  let latitude = numberOrNull(get(row, 'decimalLatitude', 'decimal_latitude', 'latitude'));
  if ((longitude === null || latitude === null) && get(row, 'mysql_point_wkt')) {
    const match = get(row, 'mysql_point_wkt').match(/^\s*POINT\s*\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)\s*$/i);
    if (match) { longitude = Number(match[1]); latitude = Number(match[2]); }
  }
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) return null;
  return { longitude, latitude };
}

function readSpeciesRows(rows) {
  const byScientificName = new Map();
  const rejected = [];
  for (const [index, row] of rows.entries()) {
    const scientificName = get(row, 'scientificName', 'scientific_name');
    if (!scientificName) { rejected.push({ row: index + 2, reason: 'missing scientificName' }); continue; }
    const commonName = getReviewedCommonName(scientificName)
      || get(row, 'commonName', 'common_name', 'common_name_source', 'vernacularName', 'vernacular_name', 'species');
    if (!byScientificName.has(normalize(scientificName))) {
      byScientificName.set(normalize(scientificName), {
        scientificName,
        commonName: commonName || scientificName,
        familyName: get(row, 'family', 'family_name') || null,
      });
    }
  }
  return { species: [...byScientificName.values()], rejected };
}

function mergeSightings(stagingRows, cleanedRows) {
  const cleanedByIdentity = new Map();
  for (const row of cleanedRows) {
    const identity = recordIdentity(row);
    if (!identity) continue;
    const matches = cleanedByIdentity.get(identity) || [];
    matches.push(row);
    cleanedByIdentity.set(identity, matches);
  }
  return stagingRows.map((staging, index) => {
    const identity = recordIdentity(staging);
    const matches = identity ? cleanedByIdentity.get(identity) || [] : [];
    const cleaned = matches.length === 1 ? matches[0] : {};
    const merged = { ...cleaned };
    for (const [key, value] of Object.entries(staging)) {
      if (String(value ?? '').trim() !== '' || !(key in merged)) merged[key] = value;
    }
    return { ...merged, __row: index + 2, __ambiguousJoin: matches.length > 1 };
  });
}

async function loadFiles(dataDir) {
  const names = ['species_cleaned.csv', 'sightings_cleaned.csv', 'sightings_sql_staging.csv'];
  const contents = await Promise.all(names.map(async (name) => {
    try { return await readFile(path.join(dataDir, name), 'utf8'); }
    catch (error) { throw new Error(`Cannot read ${path.join(dataDir, name)}: ${error.message}`); }
  }));
  return {
    speciesRows: parseCsv(contents[0], names[0]),
    cleanedRows: parseCsv(contents[1], names[1]),
    stagingRows: parseCsv(contents[2], names[2]),
  };
}

function makeDescription(row, occurrenceKey) {
  const description = get(row, 'description') || null;
  const marker = `${IMPORT_MARKER}${occurrenceKey}]`;
  return description ? `${description}\n${marker}` : marker;
}

async function findOrCreateImporter(connection, apply) {
  const [rows] = await connection.execute('SELECT user_id, full_name, role, is_active FROM UserAccount WHERE email=?', [IMPORTER_EMAIL]);
  if (rows.length) {
    if (rows[0].full_name !== IMPORTER_NAME || rows[0].role !== 'RESEARCHER' || Boolean(rows[0].is_active)) {
      throw new Error(`Reporter email ${IMPORTER_EMAIL} is not the expected inactive dataset importer; set DATASET_IMPORTER_EMAIL to a dedicated account.`);
    }
    return Number(rows[0].user_id);
  }
  if (!apply) return null;
  const randomPassword = randomBytes(32).toString('base64url');
  const hash = await bcrypt.hash(randomPassword, 12);
  const [result] = await connection.execute(
    'INSERT INTO UserAccount (full_name,email,password_hash,role,is_active,organization_name) VALUES (?,?,?,\'RESEARCHER\',FALSE,?)',
    [IMPORTER_NAME, IMPORTER_EMAIL, hash, DATASET_NAME],
  );
  return Number(result.insertId);
}

function chooseRegion(locality, state, regions) {
  const normalizedLocality = normalize(locality);
  const normalizedState = normalize(state);
  const compatible = regions.filter((region) => !normalizedState || !region.state_name || normalize(region.state_name) === normalizedState);
  const exact = compatible.filter((region) => normalize(region.region_name) === normalizedLocality);
  if (exact.length === 1) return { region: exact[0], method: 'locality exact match' };
  const named = compatible.filter((region) => {
    const name = normalize(region.region_name);
    return name && (` ${normalizedLocality} `).includes(` ${name} `);
  });
  if (named.length === 1) return { region: named[0], method: 'region name in locality' };
  if (exact.length > 1 || named.length > 1) return { region: null, reason: 'ambiguous locality match' };
  return { region: null, reason: 'no reliable locality/state match' };
}

async function regionContainingPoint(connection, point, state) {
  const [rows] = await connection.execute(
    "SELECT region_id,region_name,state_name FROM Region WHERE ST_Contains(boundary,ST_GeomFromText(?,4326,'axis-order=long-lat'))=1 AND (?='' OR state_name IS NULL OR LOWER(state_name)=LOWER(?))",
    [`POINT(${point.longitude} ${point.latitude})`, state, state],
  );
  return rows.length === 1 ? rows[0] : null;
}

async function ensureIndexes(collection) {
  await Promise.all([
    collection.createIndex({ mysqlSightingId: 1 }, { unique: true, name: 'uq_mysql_sighting' }),
    collection.createIndex({ 'source.occurrence_id': 1 }, { unique: true, sparse: true, name: 'uq_layer1_occurrence' }),
  ]);
}

async function existingMongoObservation(collection, occurrenceKey) {
  return collection.findOne({ 'source.occurrence_id': occurrenceKey });
}

async function findMarkedSighting(connection, speciesId, regionId, time, longitude, latitude, occurrenceKey) {
  const marker = `${IMPORT_MARKER}${occurrenceKey}]`;
  const [rows] = await connection.execute(
    "SELECT sighting_id FROM Sighting WHERE species_id=? AND region_id=? AND sighting_time=? AND ABS(ST_X(location)-?)<0.0000001 AND ABS(ST_Y(location)-?)<0.0000001 AND LOCATE(?,COALESCE(description,''))>0 ORDER BY sighting_id LIMIT 2",
    [speciesId, regionId, time, longitude, latitude, marker],
  );
  if (rows.length > 1) throw new Error(`More than one MySQL sighting has the import marker for ${occurrenceKey}.`);
  return rows.length ? Number(rows[0].sighting_id) : null;
}

function observationDocument(row, speciesId, regionId, sightingId, point, time, occurrenceKey, species) {
  const individualCountValue = get(row, 'individualCount', 'individual_count');
  const individualCount = individualCountValue === '' ? null : Number(individualCountValue);
  return {
    mysqlSightingId: sightingId, // Existing API compatibility and unique index.
    mysql_sighting_id: sightingId, // Explicit relational link required for this dataset.
    regionId,
    species: { mysqlSpeciesId: speciesId, name: species.common_name },
    location: { latitude: point.latitude, longitude: point.longitude },
    observedAt: new Date(`${time.replace(' ', 'T')}Z`),
    source: {
      dataset_name: DATASET_NAME,
      occurrence_id: occurrenceKey,
      basis_of_record: get(row, 'basisOfRecord', 'basis_of_record') || null,
    },
    observation_details: {
      individual_count: Number.isFinite(individualCount) ? individualCount : null,
      recorded_by: get(row, 'recordedBy', 'recorded_by') || null,
      locality: get(row, 'locality') || null,
      state_province: get(row, 'stateProvince', 'state_province') || null,
      scientific_name: get(row, 'scientificName', 'scientific_name') || null,
    },
    import_metadata: { source_type: 'real_dataset', imported_at: new Date() },
    notes: get(row, 'description') || '',
  };
}

async function processSighting(row, rowNumber, context) {
  const { connection, collection, apply, reporterId, speciesByName, regions, report } = context;
  const scientificName = get(row, 'scientificName', 'scientific_name');
  const species = speciesByName.get(normalize(scientificName));
  if (!species) return report.skip(rowNumber, row, `species not resolved: ${scientificName || '(missing scientificName)'}`);
  const point = coordinates(row);
  if (!point) return report.skip(rowNumber, row, 'missing or invalid longitude/latitude');
  const time = dateTime(get(row, 'mysql_sighting_time', 'eventDate', 'event_date', 'sighting_time'));
  if (!time) return report.skip(rowNumber, row, 'missing or invalid event date/time');
  if (row.__ambiguousJoin) return report.skip(rowNumber, row, 'sightings_cleaned.csv join is ambiguous; locality/observer metadata was not guessed');
  const locality = get(row, 'locality');
  const state = get(row, 'stateProvince', 'state_province');
  let regionResult = chooseRegion(locality, state, regions);
  if (!regionResult.region) {
    const spatial = await regionContainingPoint(connection, point, state);
    if (spatial) regionResult = { region: spatial, method: 'point falls in existing region boundary' };
  }
  if (!regionResult.region) {
    const label = [locality, state].filter(Boolean).join(', ') || '(locality and state missing)';
    report.unmappedRegions.add(label);
    return report.skip(rowNumber, row, `${regionResult.reason}: ${label}`);
  }
  const regionId = Number(regionResult.region.region_id);
  report.mappedCandidates.push({ row: rowNumber, occurrenceID: occurrenceId(row) || null, locality: locality || null, stateProvince: state || null, region: regionResult.region.region_name, mapping: regionResult.method });
  const occurrenceKey = stableOccurrenceKey(row, rowNumber);
  const existingMongo = collection ? await existingMongoObservation(collection, occurrenceKey) : null;
  if (existingMongo) {
    const mysqlId = Number(existingMongo.mysql_sighting_id ?? existingMongo.mysqlSightingId);
    const [linkedRows] = await connection.execute('SELECT sighting_id FROM Sighting WHERE sighting_id=?', [mysqlId]);
    if (!linkedRows.length) throw new Error(`Mongo occurrence ${occurrenceKey} references missing MySQL sighting ${mysqlId}.`);
    report.duplicates += 1;
    return;
  }
  const existingId = await findMarkedSighting(connection, species.species_id, regionId, time, point.longitude, point.latitude, occurrenceKey);
  if (!apply) {
    if (existingId) report.recoverable += 1;
    else report.wouldImportSightings += 1;
    report.wouldCreateMongo += 1;
    return;
  }

  let sightingId = existingId;
  let insertedMySql = false;
  if (!sightingId) {
    await connection.beginTransaction();
    try {
      const description = makeDescription(row, occurrenceKey);
      const [result] = await connection.execute(
        "INSERT INTO Sighting (reported_by,species_id,animal_id,region_id,habitat_id,sighting_time,location,description,status) VALUES (?,?,NULL,?,NULL,?,ST_GeomFromText(?,4326,'axis-order=long-lat'),?,'SUBMITTED')",
        [reporterId, species.species_id, regionId, time, `POINT(${point.longitude} ${point.latitude})`, description],
      );
      sightingId = Number(result.insertId);
      await connection.commit();
      insertedMySql = true;
      report.mysqlSightingsCreated += 1;
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } else report.recoveredSightings += 1;

  const document = observationDocument(row, Number(species.species_id), regionId, sightingId, point, time, occurrenceKey, species);
  try {
    await collection.insertOne(document);
    report.mongoDocumentsCreated += 1;
  } catch (error) {
    if (error.code === 11000) {
      const collision = await existingMongoObservation(collection, occurrenceKey);
      const linkedId = Number(collision?.mysql_sighting_id ?? collision?.mysqlSightingId);
      if (collision && linkedId === sightingId) { report.duplicates += 1; return; }
    }
    if (insertedMySql) {
      try { await connection.execute('DELETE FROM Sighting WHERE sighting_id=? AND reported_by=?', [sightingId, reporterId]); }
      catch (cleanupError) { throw new Error(`Mongo insert failed (${error.message}); could not remove MySQL sighting ${sightingId} (${cleanupError.message}). Re-run the importer to recover it.`); }
      report.mysqlSightingsCreated -= 1;
    }
    throw new Error(`Mongo insert failed for occurrence ${occurrenceKey}: ${error.message}`);
  }
}

function newReport() {
  return {
    speciesCsvRows: 0, speciesUniqueRows: 0, speciesCreated: 0, speciesAlreadyPresent: 0,
    sightingsCsvRows: 0, mysqlSightingsCreated: 0, mongoDocumentsCreated: 0,
    duplicates: 0, recoveredSightings: 0, recoverable: 0, wouldImportSightings: 0, wouldCreateMongo: 0,
    skipped: [], unmappedRegions: new Set(), mappedCandidates: [],
    skip(row, data, reason) {
      this.skipped.push({ row, occurrenceID: occurrenceId(data) || null, locality: get(data, 'locality') || null, stateProvince: get(data, 'stateProvince', 'state_province') || null, reason });
    },
  };
}

async function main() {
  const options = optionsFromArgs(process.argv.slice(2));
  if (options.help) {
    console.log('Usage: npm run import:wildlife-dataset -- [--dry-run|--apply] [--full-report] [--data-dir PATH]');
    return;
  }
  if (options.apply && process.env.NODE_ENV === 'production') throw new Error('Refusing dataset imports when NODE_ENV=production.');
  if (options.apply && env.dbName !== 'wildlife_conservation') throw new Error(`Refusing write to database ${env.dbName}; imports are restricted to wildlife_conservation.`);

  const input = await loadFiles(options.dataDir);
  const report = newReport();
  report.speciesCsvRows = input.speciesRows.length;
  report.sightingsCsvRows = input.stagingRows.length;
  const parsedSpecies = readSpeciesRows(input.speciesRows);
  report.speciesUniqueRows = parsedSpecies.species.length;
  for (const rejected of parsedSpecies.rejected) report.skipped.push({ row: rejected.row, reason: `species row ${rejected.reason}` });
  const sightings = mergeSightings(input.stagingRows, input.cleanedRows);

  let mongoClient;
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    let collection = null;
    if (options.apply) {
      if (!env.mongoUri) throw new Error('MONGODB_URI is not configured; no dataset rows were changed.');
      mongoClient = new MongoClient(env.mongoUri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000 });
      await mongoClient.connect();
      collection = mongoClient.db(env.mongoDbName).collection(COLLECTION_NAME);
      await ensureIndexes(collection);
    }

    const [regions] = await connection.execute('SELECT region_id,region_name,state_name FROM Region ORDER BY region_id');
    const reporterId = await findOrCreateImporter(connection, options.apply);
    const speciesByName = new Map();
    if (options.apply) await connection.beginTransaction();
    try {
      for (const entry of parsedSpecies.species) {
        const [exactRows] = await connection.execute('SELECT species_id,scientific_name,common_name,habitat_description FROM Species WHERE scientific_name=?', [entry.scientificName]);
        let existingRows = exactRows;
        const entryTaxon = taxonKey(entry.scientificName);
        if (!existingRows.length && entryTaxon) {
          const [taxa] = await connection.execute('SELECT species_id,scientific_name,common_name,habitat_description FROM Species ORDER BY species_id');
          existingRows = taxa.filter((row) => taxonKey(row.scientific_name) === entryTaxon).slice(0, 1);
        }
        let speciesId;
        if (existingRows.length) {
          speciesId = Number(existingRows[0].species_id);
          report.speciesAlreadyPresent += 1;
          const habitat = getSpeciesHabitat(entry.scientificName);
          if (options.apply && habitat && !existingRows[0].habitat_description) {
            await connection.execute('UPDATE Species SET habitat_description=? WHERE species_id=?', [habitat, speciesId]);
          }
        } else if (options.apply) {
          const [result] = await connection.execute(
            'INSERT INTO Species (scientific_name,common_name,family_name,conservation_status,habitat_description) VALUES (?,?,?,NULL,?)',
            [entry.scientificName, entry.commonName, entry.familyName, getSpeciesHabitat(entry.scientificName)],
          );
          speciesId = Number(result.insertId);
          report.speciesCreated += 1;
        } else {
          speciesId = null;
        }
        speciesByName.set(normalize(entry.scientificName), {
          species_id: speciesId,
          common_name: existingRows[0]?.common_name || entry.commonName,
        });
      }
      if (options.apply) await connection.commit();
    } catch (error) {
      if (options.apply) await connection.rollback();
      throw error;
    }

    if (!options.apply) {
      // Resolve existing species IDs for an accurate read-only preview.
      for (const entry of parsedSpecies.species) {
        const item = speciesByName.get(normalize(entry.scientificName));
        if (item.species_id === null) {
          const [rows] = await connection.execute('SELECT species_id,common_name FROM Species WHERE scientific_name=?', [entry.scientificName]);
          if (rows.length) { item.species_id = Number(rows[0].species_id); item.common_name = rows[0].common_name; report.speciesAlreadyPresent += 1; }
          else report.speciesCreated += 1;
        }
      }
    }
    for (const [key, species] of speciesByName) {
      if (species.species_id !== null) speciesByName.set(key, species);
    }

    const context = { connection, collection, apply: options.apply, reporterId, speciesByName, regions, report };
    for (const [index, row] of sightings.entries()) {
      try { await processSighting(row, index + 2, context); }
      catch (error) { report.skip(index + 2, row, `import error: ${error.message}`); }
    }

    const skipReasons = report.skipped.reduce((counts, item) => {
      counts[item.reason] = (counts[item.reason] || 0) + 1;
      return counts;
    }, {});
    const summary = {
      mode: options.apply ? 'applied' : 'dry-run',
      dataDirectory: options.dataDir,
      species: { csvRows: report.speciesCsvRows, uniqueScientificNames: report.speciesUniqueRows, inserted: options.apply ? report.speciesCreated : 0, wouldInsert: options.apply ? 0 : report.speciesCreated, alreadyPresent: report.speciesAlreadyPresent },
      sightings: { csvRows: report.sightingsCsvRows, insertedIntoMySql: report.mysqlSightingsCreated, linkedMongoDocumentsCreated: report.mongoDocumentsCreated, duplicatesAlreadyLinked: report.duplicates, recoveredMySqlRowsLinked: report.recoveredSightings, wouldInsert: report.wouldImportSightings, wouldCreateMongoDocuments: report.wouldCreateMongo, mongoDuplicateCheck: options.apply ? 'complete' : 'not checked during dry-run', skipped: report.skipped.length },
      skipReasons,
      mappedCandidates: report.mappedCandidates,
      unmappedRegionValues: [...report.unmappedRegions].sort(),
      skippedRecords: options.fullReport ? report.skipped : report.skipped.slice(0, 10),
      skippedRecordsOmitted: options.fullReport ? 0 : Math.max(0, report.skipped.length - 10),
    };
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    connection.release();
    await pool.end();
    await mongoClient?.close();
  }
}

main().catch(async (error) => {
  console.error(`Wildlife dataset import failed: ${error.message}`);
  await pool.end().catch(() => {});
  process.exitCode = 1;
});
