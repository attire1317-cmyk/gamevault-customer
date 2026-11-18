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

const addressId = z
  .number({ required_error: 'Choose a delivery address.', invalid_type_error: 'Choose a delivery address.' })
  .int()
  .positive('Choose a delivery address.');

export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

export const rentalSchema = z.object({
  addressId,
  gameId: z.number().int().positive(),
  days: z.number().int().min(1).max(30),
});

export const orderSchema = z.object({
  addressId,
  gameId: z.number().int().positive(),
  qty: z.number().int().min(1).max(3),
});

export const productOrderSchema = z.object({
  addressId,
  productId: z.number().int().positive(),
  qty: z.number().int().min(1).max(5),
});

export const cartSchema = z.object({
  addressId,
  items: z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().min(1).max(5) }))
    .min(1, 'Your cart is empty.')
    .max(20),
});

export const wishSchema = z
  .object({
    gameId: z.number().int().positive().optional(),
    productId: z.number().int().positive().optional(),
    on: z.boolean(),
  })
  .refine((v) => (v.gameId === undefined) !== (v.productId === undefined), 'Pick one item.');

export const notifSchema = z.object({ readAll: z.literal(true) });

const phone = z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, 'Enter a valid phone number');

export const addressSchema = z.object({
  label: z.enum(['Home', 'Work', 'Other']).default('Home'),
  name: z.string().trim().min(2, 'Enter the receiver name').max(60),
  phone,
  line1: z.string().trim().min(5, 'Enter the house, street or area').max(120),
  line2: z.string().trim().max(120).default(''),
  city: z.string().trim().min(2, 'Enter the city').max(60),
  state: z.string().trim().min(2, 'Enter the state').max(60),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, 'Enter a 6 digit pincode'),
  makeDefault: z.boolean().optional(),
});

export const addressPatchSchema = addressSchema.partial();

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60),
  phone: phone.optional().or(z.literal('')),
});
