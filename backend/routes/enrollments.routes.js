import { Router } from 'express';
import {
  getMyEnrollments,
  getEnrollmentByCourse,
} from '../controllers/enrollments.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { enrollmentCourseParamSchema } from '../schemas/enrollments.schema.js';

const router = Router();

router.get('/', authenticate, getMyEnrollments);
router.get('/:courseId', authenticate, validate(enrollmentCourseParamSchema, 'params'), getEnrollmentByCourse);

export default router;
