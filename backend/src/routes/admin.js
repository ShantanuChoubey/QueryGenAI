import express from 'express';
import { listUsers, listAuditLogs } from '../controllers/admin.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';

const router = express.Router();

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

router.get('/users', listUsers);
router.get('/logs', listAuditLogs);

export default router;
