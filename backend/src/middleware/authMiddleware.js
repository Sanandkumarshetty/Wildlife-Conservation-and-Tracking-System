import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';

export async function authenticate(request,response,next) {
  const header=request.headers.authorization;
  if(!header?.startsWith('Bearer '))return response.status(401).json({error:'Authentication required'});
  try {const token=jwt.verify(header.slice(7),env.jwtSecret);const user=(await query('SELECT user_id,role,is_active FROM UserAccount WHERE user_id=?',[token.id]))[0];if(!user||!user.is_active)return response.status(401).json({error:'Account is unavailable'});request.user={id:user.user_id,role:user.role};next()}
  catch(error){if(error.name==='JsonWebTokenError'||error.name==='TokenExpiredError')return response.status(401).json({error:'Invalid or expired token'});next(error)}
}

export async function optionalAuthenticate(request,response,next) {
  const header=request.headers.authorization;
  if(!header?.startsWith('Bearer '))return next();
  try {const token=jwt.verify(header.slice(7),env.jwtSecret);const user=(await query('SELECT user_id,role,is_active FROM UserAccount WHERE user_id=?',[token.id]))[0];if(user?.is_active)request.user={id:user.user_id,role:user.role};next()}
  catch(error){if(error.name==='JsonWebTokenError'||error.name==='TokenExpiredError')return response.status(401).json({error:'Invalid or expired token'});next(error)}
}
