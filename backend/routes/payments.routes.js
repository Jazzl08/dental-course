import { Router } from 'express';
import { createPayment, mollieWebhook, getPaymentStatus } from '../controllers/payments.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPaymentSchema } from '../schemas/payments.schema.js';

const router = Router();

router.post('/webhook', mollieWebhook);
router.post('/create', authenticate, validate(createPaymentSchema), createPayment);
router.get('/:id', authenticate, getPaymentStatus);

export default router;
