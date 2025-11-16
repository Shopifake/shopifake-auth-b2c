import { betterAuth } from 'better-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  adapter: {
    type: 'postgresql',
    prisma,
    userModel: 'Customer',
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  additionalFields: [
    'lastName',
    'firstName',
    'telephone',
    'address',
    'preferences',
  ],
  plugins: [
    // Add plugins here if needed
  ],
});
