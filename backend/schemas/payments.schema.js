import { z } from 'zod';

export const createPaymentSchema = z.object({
  courseId: z.string({ required_error: 'courseId is required' }).uuid('Invalid courseId'),
});
