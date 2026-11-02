import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail } from '../models/userModel.js';
import { requireFields } from '../utils/validation.js';

const publicUser = ({ user_id, full_name, email, role }) => ({ id: user_id, fullName: full_name, email, role });
const tokenFor = user => jwt.sign({ id: user.user_id, role: user.role }, env.jwtSecret, { expiresIn: '1h' });

export async function register(req,res) {
  requireFields(req.body,['fullName','email','password']);
  if(typeof req.body.fullName!=='string'||typeof req.body.email!=='string'||typeof req.body.password!=='string'){const e=new Error('Name, email, and password must be text');e.statusCode=400;throw e}
  const fullName=req.body.fullName.trim(),email=req.body.email.trim().toLowerCase(),password=req.body.password;
  if(fullName.length<2||fullName.length>150){const e=new Error('Full name must be between 2 and 150 characters');e.statusCode=400;throw e}
  if(email.length>255||!/^\S+@\S+\.\S+$/.test(email)){const e=new Error('Enter a valid email address');e.statusCode=400;throw e}
  if (password.length < 10||Buffer.byteLength(password,'utf8')>72) { const e=new Error('Password must be at least 10 characters and no more than 72 UTF-8 bytes'); e.statusCode=400; throw e; }
  if (req.body.role && req.body.role!=='CITIZEN') { const e=new Error('Public registration is limited to citizen accounts'); e.statusCode=400; throw e; }
  if (await findUserByEmail(email)) { const e=new Error('Email is already registered'); e.statusCode=409; throw e; }
  const passwordHash=await bcrypt.hash(password,12);
  const user=await createUser({fullName,email,passwordHash,role:'CITIZEN',phoneNumber:req.body.phoneNumber||null,organizationName:req.body.organizationName||null});
  res.status(201).json({user:publicUser(user),token:tokenFor(user)});
}

export async function login(req,res) {
  requireFields(req.body,['email','password']);
  if(typeof req.body.email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim()))return res.status(400).json({error:'Enter a valid email address'});
  if(typeof req.body.password!=='string')return res.status(400).json({error:'Password must be text'});
  const user=await findUserByEmail(req.body.email.trim().toLowerCase());
  if (!user || !user.is_active || !(await bcrypt.compare(req.body.password,user.password_hash))) return res.status(401).json({error:'Invalid email or password'});
  res.json({user:publicUser(user),token:tokenFor(user)});
}
