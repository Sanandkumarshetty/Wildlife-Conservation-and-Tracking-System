import { query } from '../config/db.js';

export const findUserByEmail = async email => (await query('SELECT user_id, full_name, email, password_hash, role, is_active FROM UserAccount WHERE email = ?', [email]))[0] || null;
export async function createUser({ fullName, email, passwordHash, role = 'CITIZEN', phoneNumber = null, organizationName = null }) {
  const result = await query('INSERT INTO UserAccount (full_name,email,password_hash,role,phone_number,organization_name) VALUES (?,?,?,?,?,?)', [fullName,email,passwordHash,role,phoneNumber,organizationName]);
  return (await query('SELECT user_id,full_name,email,role,is_active FROM UserAccount WHERE user_id=?', [result.insertId]))[0];
}
