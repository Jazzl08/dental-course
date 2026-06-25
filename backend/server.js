import 'dotenv/config';
import app from './src/app.js';
import { testConnection } from './config/db.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: /health`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
