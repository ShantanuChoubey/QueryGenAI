import path from 'path';
import dotenv from 'dotenv';

// Load test env first – Vitest does not always set NODE_ENV='test'.
const testEnvPath = path.resolve(process.cwd(), '.env.test');
dotenv.config({ path: testEnvPath, override: true });

// Load default env (production) – will not overwrite already‑set variables.
const defaultEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: defaultEnvPath, override: false });


const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'LLM_API_KEY',
];

const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missing.length) {
  console.error('\n❌ STARTUP FAILURE: Missing required environment variables:');
  missing.forEach((k) => console.error(`   - ${k}`));
  process.exit(1);
}

export const env = {
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  LLM_API_KEY: process.env.LLM_API_KEY,
};
