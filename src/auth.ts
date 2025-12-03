import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const ACCESS_SECRET = process.env.BETTER_AUTH_SECRET!;

// Helper to set access token cookie (no refresh token for B2C)
const setAccessToken = (res: Response, userId: string, email: string) => {
  const b2c_accessToken = jwt.sign({ id: userId, email }, ACCESS_SECRET, { expiresIn: '24h' });

  res.cookie('b2c_accessToken', b2c_accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });
};

// POST /login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const customer = await prisma.customer.findUnique({ where: { email } });
    if (!customer || !customer.password_hash || !(await bcrypt.compare(password, customer.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    setAccessToken(res, customer.id, customer.email);

    res.json({ 
      customer: { 
        id: customer.id, 
        email: customer.email, 
        firstName: customer.firstName, 
        lastName: customer.lastName,
        telephone: customer.telephone,
        address: customer.address,
      } 
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, telephone, address } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const existing = await prisma.customer.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const customer = await prisma.customer.create({
      data: { email, password_hash, firstName, lastName, telephone, address }
    });
    setAccessToken(res, customer.id, customer.email);
    res.status(201).json({ 
      customer: { 
        id: customer.id, 
        email: customer.email, 
        firstName: customer.firstName, 
        lastName: customer.lastName,
        telephone: customer.telephone,
        address: customer.address,
      } 
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// POST /logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.clearCookie('b2c_accessToken').json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// GET /me
router.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.cookies.b2c_accessToken;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    const customer = await prisma.customer.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, firstName: true, lastName: true, telephone: true, address: true }
    });

    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json({ customer });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;