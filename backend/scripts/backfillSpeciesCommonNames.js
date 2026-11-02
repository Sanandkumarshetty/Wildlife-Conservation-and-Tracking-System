import { pool } from '../src/config/db.js';
import { getReviewedCommonName } from '../src/data/speciesCommonNames.js';

function scientificStem(name) {
  const match = String(name).match(/^([A-Z][a-z]+)(?:\s+([a-z]+))?/);
  return match ? [match[1], match[2]].filter(Boolean).join(' ') : '';
}

try {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      'SELECT species_id, scientific_name, common_name FROM Species ORDER BY species_id FOR UPDATE',
    );
    const updates = [];
    const unresolved = [];
    for (const row of rows) {
      const stem = scientificStem(row.scientific_name);
      const candidate = getReviewedCommonName(row.scientific_name);
      const current = String(row.common_name || '').trim();
      const looksLikePlaceholder = !current || current.toLowerCase() === stem.toLowerCase()
        || current.toLowerCase() === String(row.scientific_name).toLowerCase()
        || /^[A-Z][a-z]+\s+[a-z]+$/.test(current);
      if (candidate && looksLikePlaceholder) updates.push({ ...row, common_name: candidate });
      else if (looksLikePlaceholder) unresolved.push({ species_id: row.species_id, scientific_name: row.scientific_name, common_name: row.common_name });
    }

    if (process.argv.includes('--apply')) {
      for (const row of updates) {
        await connection.execute('UPDATE Species SET common_name=? WHERE species_id=?', [row.common_name, row.species_id]);
      }
      await connection.commit();
      console.log(`Updated ${updates.length} species common names; preserved ${rows.length - updates.length - unresolved.length} existing labels.`);
    } else {
      await connection.rollback();
      console.log(`Preview only: ${updates.length} common names would be updated. Run with --apply to save.`);
    }
    console.log(JSON.stringify({ totalSpecies: rows.length, updates: updates.map(({ species_id, scientific_name, common_name }) => ({ species_id, scientific_name, common_name })), unresolved }, null, 2));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
} finally {
  await pool.end();
}
