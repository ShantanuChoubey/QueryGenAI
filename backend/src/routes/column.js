import express from 'express';
import * as columnController from '../controllers/column.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { updateColumnSchema } from '../validations/schema.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/:id', columnController.getColumn);
router.patch('/:id', validate(updateColumnSchema), columnController.updateColumn);
router.delete('/:id', columnController.deleteColumn);

export default router;
