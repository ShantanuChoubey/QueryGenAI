import express from 'express';
import { generateSqlPrompt } from '../controllers/sql.js';
import { validate } from '../validations/validation.js';
import { generateSqlSchema } from '../validations/sql.js';

const router = express.Router();

router.post('/generate', validate(generateSqlSchema), generateSqlPrompt);

export default router;
