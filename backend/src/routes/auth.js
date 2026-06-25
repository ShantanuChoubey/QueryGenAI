import express from 'express';
import { register, login, me } from '../controllers/auth.js';
import { protect } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../validations/validation.js';
import { registerSchema, loginSchema } from '../validations/auth.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', protect, authorize('USER', 'ADMIN'), me);

export default router;
