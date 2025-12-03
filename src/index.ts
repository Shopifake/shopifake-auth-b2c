import './instrumentation';
import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import customerRoutes from './routes/customers';
import authRoutes from './auth';

const app = express();
const PORT = process.env.PORT || 3000;

// TODO: Remove DATABASE_URL fallback after migration (thanks Matthéo)
// Construct DATABASE_URL from individual env vars or use legacy DATABASE_URL
let DATABASE_URL: string;

if (process.env.DATABASE_URL) {
  console.warn('⚠️  WARNING: Using legacy DATABASE_URL environment variable');
  console.warn('⚠️  Please migrate to: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
  console.warn('⚠️  This fallback will be removed in a future version (thanks Matthéo, )');
  DATABASE_URL = process.env.DATABASE_URL;
} else {
  // Validate required database environment variables
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌ Missing required database environment variables:', missingVars.join(', '));
    console.error('💡 Please set: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    process.exit(1);
  }

  const DB_HOST = process.env.DB_HOST!;
  const DB_PORT = process.env.DB_PORT!;
  const DB_NAME = process.env.DB_NAME!;
  const DB_USER = process.env.DB_USER!;
  const DB_PASSWORD = process.env.DB_PASSWORD!;

  DATABASE_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;

  console.log('   Database configuration:');
  console.log(`   Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log(`   User: ${DB_USER}`);
  console.log(`   Connection string: postgresql://${DB_USER}:***@${DB_HOST}:${DB_PORT}/${DB_NAME}`);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

// Test database connection on startup
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Failed to connect to database:', error.message);
    console.error('💡 Check your DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD');
    process.exit(1);
  });

app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/auth-b2c', authRoutes);
app.use('/api/auth-b2c/customers', customerRoutes);

// --- Healthcheck route ---
app.get('/healthz', async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'available';
  } catch (error: any) {
    dbStatus = 'unavailable';
    dbError = error.message;
    console.error('❌ Health check failed - Database error:', error.message);
  }
  const isHealthy = dbStatus === 'available';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DOWN',
    db: dbStatus,
    service: isHealthy ? 'up' : 'down',
    ...(dbError && { error: dbError })
  });
});

app.get('/', (req, res) => {
  res.send('Shopifake B2C Customer Microservice is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 B2C Microservice started on http://localhost:${PORT}`);
});