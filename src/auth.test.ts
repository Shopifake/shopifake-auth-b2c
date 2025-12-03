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
  password_hash: '',
  createdAt: new Date(),
  updatedAt: new Date()
};

let mockFindUnique: jest.Mock;
let mockCreate: jest.Mock;

jest.mock('@prisma/client', () => {
  mockFindUnique = jest.fn();
  mockCreate = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      customer: {
        findUnique: mockFindUnique,
        create: mockCreate
      }
    }))
  };
});

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

import authRoutes from './auth';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);

const ACCESS_SECRET = 'test-secret';

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      mockFindUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockCreate.mockResolvedValue(mockCustomer);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          telephone: '1234567890',
          address: '123 Test St'
        });

      expect(res.status).toBe(201);
      expect(res.body.customer).toEqual({
        id: mockCustomer.id,
        email: mockCustomer.email,
        firstName: mockCustomer.firstName,
        lastName: mockCustomer.lastName,
        telephone: mockCustomer.telephone,
        address: mockCustomer.address
      });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 when email or password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password required');
    });

    it('should return 409 when email already exists', async () => {
      mockFindUnique.mockResolvedValue(mockCustomer);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = 'hashed_password';
      mockFindUnique.mockResolvedValue({ ...mockCustomer, password_hash: hashedPassword });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.customer.email).toBe(mockCustomer.email);
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 with invalid credentials', async () => {
      mockFindUnique.mockResolvedValue({ ...mockCustomer, password_hash: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 when user not found', async () => {
      mockFindUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      mockFindUnique.mockResolvedValue(mockCustomer);
      const token = jwt.sign({ id: mockCustomer.id, email: mockCustomer.email }, ACCESS_SECRET, { expiresIn: '24h' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`b2c_accessToken=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.customer.email).toBe(mockCustomer.email);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['b2c_accessToken=invalid_token']);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('should return 404 when customer not found', async () => {
      mockFindUnique.mockResolvedValue(null);
      const token = jwt.sign({ id: 'nonexistent', email: 'test@example.com' }, ACCESS_SECRET, { expiresIn: '24h' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`b2c_accessToken=${token}`]);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Customer not found');
    });
  });
});