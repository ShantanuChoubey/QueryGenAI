import express from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validations/workspace.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', workspaceController.listUserWorkspaces);
router.get('/:id', workspaceController.getWorkspace);
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

export default router;
