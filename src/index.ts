import './instrumentation';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import customerRoutes from './routes/customers';
import authRoutes from './auth';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('', authRoutes);
app.use('/customers', customerRoutes);

// --- Healthcheck route ---
app.get('/healthz', async (req, res) => {
  let dbStatus = 'unknown';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'available';
  } catch {
    dbStatus = 'unavailable';
  }
  const isHealthy = dbStatus === 'available';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    db: dbStatus,
    service: isHealthy ? 'up' : 'down'
  });
});

app.get('/', (req, res) => {
  res.send('Shopifake B2C Customer Microservice is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 B2C Microservice started on http://localhost:${PORT}`);
});