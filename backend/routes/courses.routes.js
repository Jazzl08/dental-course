import express from 'express';
import { getAllCourses, getCourseById, getCourseBySlug } from '../controllers/courses.controller.js';
import { validate } from '../middleware/validate.js';
import { courseParamSchema, courseSlugParamSchema } from '../schemas/courses.schema.js';

const router = express.Router();

router.get('/', getAllCourses);
router.get('/slug/:slug', validate(courseSlugParamSchema, 'params'), getCourseBySlug);
router.get('/:id', validate(courseParamSchema, 'params'), getCourseById);

export default router;
