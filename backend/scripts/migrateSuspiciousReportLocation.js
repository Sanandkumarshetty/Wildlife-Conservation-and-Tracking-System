import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('This development migration refuses to run when NODE_ENV=production.');
}
if (env.dbName !== 'wildlife_conservation') {
  throw new Error(`Refusing to alter database ${env.dbName}; migration is restricted to wildlife_conservation.`);
}

try {
  const [columns] = await pool.execute(
    'SELECT COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?',
    [env.dbName, 'SuspiciousReport'],
  );
  const regionColumn = columns.find((column) => column.COLUMN_NAME === 'region_id');
  if (!regionColumn) throw new Error('SuspiciousReport.region_id does not exist.');

  if (regionColumn.IS_NULLABLE !== 'YES') {
    await pool.query('ALTER TABLE SuspiciousReport MODIFY COLUMN region_id INT NULL');
    console.log('Changed SuspiciousReport.region_id to nullable; existing values were preserved.');
  }
  if (!columns.some((column) => column.COLUMN_NAME === 'location_name')) {
    await pool.query('ALTER TABLE SuspiciousReport ADD COLUMN location_name VARCHAR(255) NULL AFTER region_id');
    console.log('Added nullable SuspiciousReport.location_name; existing rows remain NULL in this column.');
  }
  console.log('Suspicious report location migration complete.');
} finally {
  await pool.end();
}
