import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  assignCourse,
  createCourse,
  createLesson,
  createQuizQuestion,
  createWeek,
  deleteUser,
  getDashboard,
  listUsers,
  setUserStatus,
  listPayments,
  listProgress,
  listCertificates,
} from '../controllers/admin.controller.js';
import {
  assignCourseSchema,
  createCourseSchema,
  createLessonSchema,
  createQuizQuestionSchema,
  createWeekSchema,
  idParamSchema,
  userStatusSchema,
} from '../schemas/admin.schema.js';

const router = Router();

router.use(authenticate, requireRole('admin'));
router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.get('/payments', listPayments);
router.get('/progress', listProgress);
router.get('/certificates', listCertificates);
router.patch('/users/:id/status', validate(idParamSchema, 'params'), validate(userStatusSchema), setUserStatus);
router.delete('/users/:id', validate(idParamSchema, 'params'), deleteUser);
router.post('/users/:id/assign-course', validate(idParamSchema, 'params'), validate(assignCourseSchema), assignCourse);
router.post('/courses', validate(createCourseSchema), createCourse);
router.post('/courses/:id/weeks', validate(idParamSchema, 'params'), validate(createWeekSchema), createWeek);
router.post('/weeks/:id/lessons', validate(idParamSchema, 'params'), validate(createLessonSchema), createLesson);
router.post('/lessons/:id/quiz-questions', validate(idParamSchema, 'params'), validate(createQuizQuestionSchema), createQuizQuestion);

export default router;
