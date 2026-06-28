import express from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as tableController from '../controllers/table.controller.js';
import * as relationshipController from '../controllers/relationship.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validations/workspace.js';
import { createTableSchema } from '../validations/schema.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', workspaceController.listUserWorkspaces);
router.get('/:id', workspaceController.getWorkspace);
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Workspace-nested table and relationship routes
router.get('/:workspaceId/tables', tableController.listWorkspaceTables);
router.post('/:workspaceId/tables', validate(createTableSchema), tableController.createTable);
router.get('/:workspaceId/relationships', relationshipController.listWorkspaceRelationships);

export default router;
