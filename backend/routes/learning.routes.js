import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  completeLesson,
  downloadCertificate,
  getCertificate,
  getDashboard,
  getLesson,
  submitQuiz,
} from '../controllers/learning.controller.js';
import {
  courseParamSchema,
  lessonDetailParamSchema,
  lessonParamSchema,
  quizSubmitParamSchema,
  quizSubmitSchema,
} from '../schemas/learning.schema.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getDashboard);
router.get('/courses/:courseId/lessons/:lessonId', validate(lessonDetailParamSchema, 'params'), getLesson);
router.post('/lessons/:lessonId/complete', validate(lessonParamSchema, 'params'), completeLesson);
router.post('/quizzes/:quizId/submit', validate(quizSubmitParamSchema, 'params'), validate(quizSubmitSchema), submitQuiz);
router.get('/certificates/:courseId', validate(courseParamSchema, 'params'), getCertificate);
router.get('/certificates/:courseId/download', validate(courseParamSchema, 'params'), downloadCertificate);

export default router;
