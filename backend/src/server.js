import { env } from './config/env.js';
import app from './app.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(
    `🚀 QueryGenAI Server listening on port ${PORT} in ${env.NODE_ENV} mode`
  );
  console.log(`🔗 Healthcheck available at: http://localhost:${PORT}/api/v1/health`);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('Received kill signal, shutting down gracefully...');
  server.close(() => {
    console.log('Closed out remaining connections.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
