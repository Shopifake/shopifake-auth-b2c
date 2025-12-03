import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();
const ACCESS_SECRET = process.env.BETTER_AUTH_SECRET!;

// Middleware to check authentication
const requireAuth = async (req: Request, res: Response, next: Function) => {
  try {
    const token = req.cookies.b2c_accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, ACCESS_SECRET) as any;
    (req as any).userId = decoded.id;
    next();
  } catch  {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Get own profile
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const myProfile = await prisma.customer.findUnique({
      where: { id: (req as any).userId }
    });
    
    if (!myProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    const { password_hash, ...profileWithoutPassword } = myProfile;
    res.json(profileWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update own profile
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { lastName, firstName, telephone, address } = req.body;
    
    const updatedProfile = await prisma.customer.update({
      where: { id: (req as any).userId },
      data: {
        lastName,
        firstName,
        telephone,
        address,
      }
    });
    
    const { password_hash, ...profileWithoutPassword } = updatedProfile;
    res.json(profileWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Delete own account
router.delete('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.customer.delete({ where: { id: (req as any).userId } });
    res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;