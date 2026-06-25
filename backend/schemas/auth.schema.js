import { z } from 'zod';

const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Wachtwoord moet minimaal 8 tekens bevatten')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
  token: z.string({ required_error: 'Token is required' }).min(32, 'Invalid token'),
});

export const resendVerificationSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email').toLowerCase().trim(),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ required_error: 'Email is required' }).email('Invalid email').toLowerCase().trim(),
});

export const resetPasswordSchema = z.object({
  token: z.string({ required_error: 'Token is required' }).min(32, 'Invalid token'),
  password: passwordSchema,
});
