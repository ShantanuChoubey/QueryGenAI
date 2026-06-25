import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(
    `🚀 QueryGenAI Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
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
