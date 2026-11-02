import { Router } from 'express';
import { login, register } from '../controllers/authController.js';
const router = Router();
const asyncHandler=fn=>(request,response,next)=>Promise.resolve(fn(request,response,next)).catch(next);
router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
export default router;
