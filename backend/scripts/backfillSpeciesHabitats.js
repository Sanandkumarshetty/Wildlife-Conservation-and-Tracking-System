import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { getSpeciesHabitat } from '../src/data/speciesHabitats.js';

const apply = process.argv.includes('--apply');
if (apply && process.env.NODE_ENV === 'production') {
  throw new Error('Refusing to update species habitat data when NODE_ENV=production.');
}
if (apply && env.dbName !== 'wildlife_conservation') {
  throw new Error(`Refusing write to database ${env.dbName}; habitat updates are restricted to wildlife_conservation.`);
}

try {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT species_id, scientific_name, habitat_description FROM Species ORDER BY species_id FOR UPDATE',
    );
    const updates = [];
    const unmatched = [];
    for (const row of rows) {
      const habitat = getSpeciesHabitat(row.scientific_name);
      if (habitat) updates.push({ species_id: row.species_id, scientific_name: row.scientific_name, habitat });
      else if (!row.habitat_description) unmatched.push({ species_id: row.species_id, scientific_name: row.scientific_name });
    }

    if (apply) {
      for (const row of updates) {
        await connection.execute('UPDATE Species SET habitat_description=? WHERE species_id=?', [row.habitat, row.species_id]);
      }
      await connection.commit();
      console.log(`Updated habitat for ${updates.length} matching Species records.`);
    } else {
      await connection.rollback();
      console.log(`Preview only: ${updates.length} matching Species records would be updated. Run with --apply to save.`);
    }
    console.log(JSON.stringify({ totalSpecies: rows.length, matchedRecords: updates.length, unmatchedWithoutHabitat: unmatched }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
