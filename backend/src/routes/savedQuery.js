import express from 'express';
import * as savedQueryController from '../controllers/savedQuery.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { createSavedQuerySchema, updateSavedQuerySchema } from '../validations/savedQuery.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Search must be declared BEFORE /:id to avoid conflict
router.get('/search', savedQueryController.search);

router.post('/', validate(createSavedQuerySchema), savedQueryController.create);
router.get('/:id', savedQueryController.getOne);
router.patch('/:id', validate(updateSavedQuerySchema), savedQueryController.update);
router.delete('/:id', savedQueryController.remove);
router.patch('/:id/favorite', savedQueryController.favorite);

export default router;
