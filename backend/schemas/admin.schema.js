import { z } from 'zod';

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().min(3).max(220),
  shortDesc: z.string().max(500).optional(),
  description: z.string().min(10),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('EUR'),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  durationMin: z.number().int().positive().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  isPublished: z.boolean().default(false),
});

export const createWeekSchema = z.object({
  weekNumber: z.number().int().min(1),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  unlockAfterDays: z.number().int().min(0).default(0),
});

export const createLessonSchema = z.object({
  title: z.string().min(3).max(200),
  lessonType: z.enum(['video', 'text', 'download', 'quiz', 'assignment']).default('text'),
  content: z.string().optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  downloadUrl: z.string().url().optional().or(z.literal('')),
  assignmentPrompt: z.string().optional(),
  durationMin: z.number().int().positive().optional(),
  position: z.number().int().min(1),
  isPreview: z.boolean().default(false),
});

export const createQuizQuestionSchema = z.object({
  question: z.string().min(3),
  options: z.array(z.string().min(1)).min(2).max(6),
  correctAnswer: z.string().min(1),
  explanation: z.string().optional(),
  position: z.number().int().min(1).default(1),
}).refine(
  (data) => data.options.includes(data.correctAnswer),
  { message: 'correctAnswer must be one of the provided options', path: ['correctAnswer'] }
);

export const userStatusSchema = z.object({
  isBlocked: z.boolean(),
});

export const assignCourseSchema = z.object({
  courseId: z.string().uuid('Invalid course id'),
});
