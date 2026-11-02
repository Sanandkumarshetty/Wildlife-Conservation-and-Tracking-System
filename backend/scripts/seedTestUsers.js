import bcrypt from 'bcryptjs';
import { env } from '../src/config/env.js';
import { pool } from '../src/config/db.js';

const accounts = [
  {
    fullName: 'System Administrator',
    email: 'admin@wildlife.local',
    password: 'WildlifeAdmin!2026',
    role: 'ADMIN',
    organization: 'Wildlife Conservation System',
  },
  {
    fullName: 'Ravi Kumar',
    email: 'ravi.ranger@wildlife.local',
    password: 'WildlifeRanger!2026',
    role: 'RANGER',
    organization: 'Forest Department',
  },
  {
    fullName: 'Dr Meera Nair',
    email: 'meera.research@wildlife.local',
    password: 'WildlifeResearch!2026',
    role: 'RESEARCHER',
    organization: 'Western Ghats Research Institute',
  },
  {
    fullName: 'Arjun Shetty',
    email: 'arjun.citizen@wildlife.local',
    password: 'WildlifeCitizen!2026',
    role: 'CITIZEN',
    organization: null,
  },
];

if (process.env.NODE_ENV !== 'development' || process.env.ALLOW_TEST_USERS !== 'true') {
  console.error('Refusing to seed test accounts. Set NODE_ENV=development and ALLOW_TEST_USERS=true explicitly.');
  process.exitCode = 1;
} else if (env.dbName !== 'wildlife_conservation') {
  console.error(`Refusing to seed ${env.dbName}; this script is restricted to the wildlife_conservation development database.`);
  process.exitCode = 1;
} else {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [regions] = await connection.execute('SELECT region_id FROM Region ORDER BY region_id LIMIT 1');
    const [institutions] = await connection.execute("SELECT institution_id FROM Institution WHERE institution_type='RESEARCH_INSTITUTE' ORDER BY institution_id LIMIT 1");
    const createdOrReset = [];

    for (const account of accounts) {
      const [existingRows] = await connection.execute(
        'SELECT user_id, role FROM UserAccount WHERE email=? FOR UPDATE',
        [account.email],
      );
      const passwordHash = await bcrypt.hash(account.password, 12);
      let userId;

      if (existingRows.length) {
        const existing = existingRows[0];
        if (existing.role !== account.role) {
          throw new Error(`Refusing to change ${account.email}: existing role is ${existing.role}, expected ${account.role}.`);
        }
        userId = existing.user_id;
        await connection.execute(
          'UPDATE UserAccount SET password_hash=?,is_active=TRUE WHERE user_id=?',
          [passwordHash, userId],
        );
      } else {
        const [result] = await connection.execute(
          'INSERT INTO UserAccount (full_name,email,password_hash,role,organization_name) VALUES (?,?,?,?,?)',
          [account.fullName, account.email, passwordHash, account.role, account.organization],
        );
        userId = result.insertId;
      }

      if (regions.length && ['RANGER', 'RESEARCHER'].includes(account.role)) {
        await connection.execute(
          'INSERT INTO UserRegion (user_id,region_id) VALUES (?,?) ON DUPLICATE KEY UPDATE region_id=VALUES(region_id)',
          [userId, regions[0].region_id],
        );
      }
      if (account.role === 'RESEARCHER' && institutions.length) {
        await connection.execute(
          'INSERT IGNORE INTO InstitutionMember (institution_id,user_id,member_role) VALUES (?,?,?)',
          [institutions[0].institution_id, userId, 'Test Researcher'],
        );
      }
      createdOrReset.push(account.email);
    }

    await connection.commit();
    console.log(`Created or reset ${createdOrReset.length} test accounts in ${env.dbName}:`);
    for (const account of accounts) console.log(`${account.role}: ${account.email} / ${account.password}`);
  } catch (error) {
    await connection.rollback();
    console.error(`Test account seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

if (process.exitCode) await pool.end();
