import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { errorHandler, notFoundHandler } from '../middleware/errorHandler.js';

import authRoutes from '../routes/auth.routes.js';
import coursesRoutes from '../routes/courses.routes.js';
import paymentsRoutes from '../routes/payments.routes.js';
import usersRoutes from '../routes/users.routes.js';
import enrollmentsRoutes from '../routes/enrollments.routes.js';
import learningRoutes from '../routes/learning.routes.js';
import adminRoutes from '../routes/admin.routes.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());

const rawOrigins = (process.env.CORS_ORIGINS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (rawOrigins.length === 0) {
        return callback(null, process.env.NODE_ENV !== 'production');
      }
      return callback(null, rawOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(cookieParser());
app.use('/api/payments/webhook', express.urlencoded({ extended: false }));
app.use(express.json({ limit: '1mb' }));

if (process.env.NODE_ENV !== 'development') {
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Try again later.' },
  });
  app.use(globalLimiter);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
