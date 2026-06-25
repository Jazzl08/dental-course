import { z } from 'zod';

export const enrollmentCourseParamSchema = z.object({
  courseId: z.string().uuid('Invalid course id'),
});

export const enrollmentProgressSchema = z.object({
  progressPct: z
    .number({ required_error: 'progressPct is required' })
    .int('progressPct must be an integer')
    .min(0, 'progressPct must be at least 0')
    .max(100, 'progressPct must be at most 100'),
});
