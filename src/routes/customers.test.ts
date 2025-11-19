import request from 'supertest';
import express from 'express';
import customerRoutes from './customers';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      customer: {
        findMany: jest.fn().mockResolvedValue([])
      }
    }))
  };
});


const app = express();
app.use(express.json());
app.use('/api/customers', customerRoutes);

describe('Customer routes', () => {
  it('GET /api/customers should return array', async () => {
    const res = await request(app).get('/api/customers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
