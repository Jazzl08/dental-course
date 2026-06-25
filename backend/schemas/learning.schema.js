import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid id'),
});

export const lessonParamSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson id'),
});

export const lessonDetailParamSchema = z.object({
  courseId: z.string().uuid('Invalid course id'),
  lessonId: z.string().uuid('Invalid lesson id'),
});

export const courseParamSchema = z.object({
  courseId: z.string().uuid('Invalid course id'),
});

export const quizSubmitParamSchema = z.object({
  quizId: z.string().uuid('Invalid quiz id'),
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid('Invalid question id'),
        answer: z.string().min(1).max(500),
      })
    )
    .min(1, 'At least one answer is required'),
});
