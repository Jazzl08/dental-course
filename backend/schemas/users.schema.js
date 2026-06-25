import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100),
  profilePhotoUrl: z.string().url().optional().or(z.literal('')),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(8, 'Wachtwoord moet minimaal 8 tekens bevatten')
    .max(128, 'Wachtwoord mag maximaal 128 tekens bevatten')
    .regex(/[A-Z]/, 'Wachtwoord moet minimaal één hoofdletter bevatten')
    .regex(/[0-9]/, 'Wachtwoord moet minimaal één cijfer bevatten'),
});
