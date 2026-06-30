import express from 'express';
import * as workspaceController from '../controllers/workspace.controller.js';
import * as tableController from '../controllers/table.controller.js';
import * as relationshipController from '../controllers/relationship.controller.js';
import * as savedQueryController from '../controllers/savedQuery.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { createWorkspaceSchema, updateWorkspaceSchema } from '../validations/workspace.js';
import { createTableSchema } from '../validations/schema.js';

import * as schemaImportController from '../controllers/schemaImport.controller.js';
import { handleUpload } from '../middleware/upload.js';
import * as diagramController from '../controllers/diagram.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', workspaceController.listUserWorkspaces);
router.get('/:id', workspaceController.getWorkspace);
router.post('/', validate(createWorkspaceSchema), workspaceController.createWorkspace);
router.patch('/:id', validate(updateWorkspaceSchema), workspaceController.updateWorkspace);
router.delete('/:id', workspaceController.deleteWorkspace);

// Workspace-nested table, relationship, and saved-queries routes
router.get('/:workspaceId/tables', tableController.listWorkspaceTables);
router.post('/:workspaceId/tables', validate(createTableSchema), tableController.createTable);
router.get('/:workspaceId/relationships', relationshipController.listWorkspaceRelationships);
router.get('/:workspaceId/saved-queries', savedQueryController.list);

// Schema import routes
router.post('/:workspaceId/import/sql', handleUpload, schemaImportController.previewSql);
router.post('/:workspaceId/import/json', handleUpload, schemaImportController.previewJson);
router.post('/:workspaceId/import/csv', handleUpload, schemaImportController.previewCsv);
router.post('/:workspaceId/import/confirm', schemaImportController.confirmImport);

// ER Diagram route (read-only)
router.get('/:workspaceId/diagram', diagramController.getDiagram);

export default router;
