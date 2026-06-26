import express from 'express';
import { getHistory, deleteHistoryItem } from '../controllers/history.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All history routes require authentication
router.use(protect);

// GET /api/v1/history — paginated query history for the authenticated user
router.get('/', getHistory);

// DELETE /api/v1/history/:id — delete a specific history entry
router.delete('/:id', deleteHistoryItem);

export default router;
