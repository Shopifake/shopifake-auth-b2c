import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkAuth } from '../middleware/checkAuth';

const prisma = new PrismaClient();
const router = Router();

// --- Logged-in Customer Profile Routes ---
router.get('/me', checkAuth, async (req: Request, res: Response) => {
  try {
    const myProfile = await prisma.customer.findUnique({
      where: { id: req.user!.id }
    });
    if (!myProfile) {
      return res.status(404).json({ error: 'Profile not found.' });
    }
    res.json(myProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/me', checkAuth, async (req: Request, res: Response) => {
  try {
    const { lastName, firstName, telephone, address, preferences } = req.body;
    const updatedProfile = await prisma.customer.update({
      where: { id: req.user!.id },
      data: {
        lastName,
        firstName,
        telephone,
        address,
        preferences
      }
    });
    res.json(updatedProfile);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// --- Admin-like Endpoints (no roles) ---
router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password_hash, lastName, firstName, telephone, address, preferences } = req.body;
    if (!email || !password_hash) {
      return res.status(400).json({ error: 'Missing required fields: email, password_hash' });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    const newCustomer = await prisma.customer.create({
      data: {
        email,
        password_hash,
        lastName,
        firstName,
        telephone,
        address,
        preferences
      }
    });
    res.status(201).json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { lastName, firstName, telephone, address, preferences } = req.body;
    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        lastName,
        firstName,
        telephone,
        address,
        preferences
      }
    });
    res.json(updatedCustomer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.customer.delete({ where: { id } });
    res.status(200).json({ message: 'Customer successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;