import path from 'path';
import dotenv from 'dotenv';

// In test environments, load .env.test first (it overrides any existing vars).
// In production (e.g. Render), environment variables are injected directly —
// we must NOT load .env.test or it will overwrite real production credentials.
if (process.env.NODE_ENV === 'test') {
  const testEnvPath = path.resolve(process.cwd(), '.env.test');
  dotenv.config({ path: testEnvPath, override: true });
}

// Load .env as a fallback (ignored when vars are already set by the OS/platform).
const defaultEnvPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: defaultEnvPath, override: false });


const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'GEMINI_API_KEY',
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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // Optional: override the AI model. Falls back to gemini-2.5-flash if not set.
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
};
