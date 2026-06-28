import express from 'express';
import * as relationshipController from '../controllers/relationship.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { createRelationshipSchema, updateRelationshipSchema } from '../validations/schema.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', validate(createRelationshipSchema), relationshipController.createRelationship);
router.get('/:id', relationshipController.getRelationship);
router.patch('/:id', validate(updateRelationshipSchema), relationshipController.updateRelationship);
router.delete('/:id', relationshipController.deleteRelationship);

export default router;
