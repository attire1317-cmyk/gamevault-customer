import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(120);
const password = z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  email,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  password,
});

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

export const rentalSchema = z.object({
  gameId: z.number().int().positive(),
  days: z.number().int().min(1).max(30),
});

export const orderSchema = z.object({
  gameId: z.number().int().positive(),
  qty: z.number().int().min(1).max(3),
});

export const productOrderSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().min(1).max(5),
});
