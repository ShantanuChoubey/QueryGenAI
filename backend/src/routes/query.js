import express from 'express';

const router = express.Router();

// Placeholder for future endpoints (e.g. POST /api/v1/queries/generate)
router.post('/generate', (req, res) => {
  res.status(501).json({
    message: 'Query generation endpoint not implemented yet.',
  });
});

export default router;
