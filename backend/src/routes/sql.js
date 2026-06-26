import express from 'express';
import { generateSqlPrompt } from '../controllers/sql.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../validations/validation.js';
import { generateSqlSchema } from '../validations/sql.js';

const router = express.Router();

// SQL generation requires authentication — prevents unauthenticated API quota abuse
router.post('/generate', protect, validate(generateSqlSchema), generateSqlPrompt);

export default router;
