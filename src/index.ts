import './instrumentation';
import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import customerRoutes from './routes/customers';

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(express.json());

// --- Customer API routes ---
app.use('/api/customers', customerRoutes);

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