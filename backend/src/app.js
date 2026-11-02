import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import { mongoStatus } from './services/fieldObservations.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '8mb' }));
const attempts=new Map();
function authRateLimit(request,response,next){const now=Date.now(),key=request.ip,entry=attempts.get(key);if(!entry||now-entry.start>15*60*1000){attempts.set(key,{start:now,count:1});return next()}if(entry.count>=30)return response.status(429).json({error:'Too many authentication attempts. Try again later.'});entry.count++;next()}
app.get('/api/health', (request, response) => response.json({ status: 'ok' }));
app.get('/api/health/mongodb', async (request, response) => {
  const status = await mongoStatus();
  response.status(status.available ? 200 : 503).json(status);
});
app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api', apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);
export default app;
