import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import sqlRouter from './routes/sql.js';
import { generalLimiter, aiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Set up standard middlewares
app.use(cors());
app.use(express.json());

// Main router definition
const apiRouter = express.Router();

// Apply general rate limiting across all API endpoints
apiRouter.use(generalLimiter);

// Health check endpoint under global prefix: /api/v1/health
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'QueryGenAI Backend',
  });
});

// Register auth routes
apiRouter.use('/auth', authRouter);

// Register sql routes with specific AI rate limiter
apiRouter.use('/sql', aiLimiter, sqlRouter);

// Mount routes under /api/v1
app.use('/api/v1', apiRouter);

// Base route fallback
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource could not be found.',
  });
});

// Global error handler middleware
app.use((err, req, res, _next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred.',
  });
});

export default app;
