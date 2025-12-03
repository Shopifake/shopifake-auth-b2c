import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

// Set environment variable before importing modules
process.env.BETTER_AUTH_SECRET = 'test-secret';

const mockCustomer = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  telephone: '1234567890',
  address: '123 Test St',
  password_hash: 'hashed_password',
  createdAt: new Date(),
  updatedAt: new Date()
};

let mockFindUnique: jest.Mock;
let mockUpdate: jest.Mock;
let mockDelete: jest.Mock;

jest.mock('@prisma/client', () => {
  mockFindUnique = jest.fn();
  mockUpdate = jest.fn();
  mockDelete = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      customer: {
        findUnique: mockFindUnique,
        update: mockUpdate,
        delete: mockDelete
      }
    }))
  };
});

import customerRoutes from './customers';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/customers', customerRoutes);

const ACCESS_SECRET = 'test-secret';

const generateToken = (userId: string, email: string) => {
  return jwt.sign({ id: userId, email }, ACCESS_SECRET, { expiresIn: '24h' });
};

describe('Customer routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/customers/me', () => {
    it('should return user profile when authenticated', async () => {
      mockFindUnique.mockResolvedValue(mockCustomer);
      const token = generateToken(mockCustomer.id, mockCustomer.email);

      const res = await request(app)
        .get('/api/customers/me')
        .set('Cookie', [`b2c_accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        id: mockCustomer.id,
        email: mockCustomer.email,
        firstName: mockCustomer.firstName,
        lastName: mockCustomer.lastName,
        telephone: mockCustomer.telephone,
        address: mockCustomer.address,
        createdAt: mockCustomer.createdAt.toISOString(),
        updatedAt: mockCustomer.updatedAt.toISOString()
      });
      expect(res.body.password_hash).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/customers/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });

    it('should return 404 when profile not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const token = generateToken(mockCustomer.id, mockCustomer.email);

      const res = await request(app)
        .get('/api/customers/me')
        .set('Cookie', [`b2c_accessToken=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Profile not found');
    });
  });

  describe('PUT /api/customers/me', () => {
    it('should update user profile when authenticated', async () => {
      const updatedData = {
        lastName: 'Smith',
        firstName: 'Jane',
        telephone: '0987654321',
        address: '456 New St'
      };
      mockUpdate.mockResolvedValue({ ...mockCustomer, ...updatedData });
      const token = generateToken(mockCustomer.id, mockCustomer.email);

      const res = await request(app)
        .put('/api/customers/me')
        .set('Cookie', [`b2c_accessToken=${token}`])
        .send(updatedData);

      expect(res.status).toBe(200);
      expect(res.body.firstName).toBe(updatedData.firstName);
      expect(res.body.lastName).toBe(updatedData.lastName);
      expect(res.body.password_hash).toBeUndefined();
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app)
        .put('/api/customers/me')
        .send({ firstName: 'Jane' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/customers/me', () => {
    it('should delete user account when authenticated', async () => {
      mockDelete.mockResolvedValue(mockCustomer);
      const token = generateToken(mockCustomer.id, mockCustomer.email);

      const res = await request(app)
        .delete('/api/customers/me')
        .set('Cookie', [`b2c_accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Account successfully deleted');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).delete('/api/customers/me');
      expect(res.status).toBe(401);
    });
  });
});