import { z } from 'zod';

export const courseParamSchema = z.object({
  id: z.string().uuid('Invalid course id'),
});

export const courseSlugParamSchema = z.object({
  slug: z.string({ required_error: 'Slug is required' }).min(3, 'Invalid slug').max(220),
});
