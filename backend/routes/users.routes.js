import { Router } from 'express';
import { getMyCourses, getProfile, updatePassword, updateProfile } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updatePasswordSchema, updateProfileSchema } from '../schemas/users.schema.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/password', authenticate, validate(updatePasswordSchema), updatePassword);
router.get('/courses', authenticate, getMyCourses);

export default router;
