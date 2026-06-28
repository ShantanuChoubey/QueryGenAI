import express from 'express';
import * as tableController from '../controllers/table.controller.js';
import * as columnController from '../controllers/column.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { updateTableSchema, createColumnSchema } from '../validations/schema.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/:id', tableController.getTable);
router.patch('/:id', validate(updateTableSchema), tableController.updateTable);
router.delete('/:id', tableController.deleteTable);

// Column nested routes
router.get('/:tableId/columns', columnController.listTableColumns);
router.post('/:tableId/columns', validate(createColumnSchema), columnController.createColumn);

export default router;
