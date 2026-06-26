// Global test setup for QueryGenAI backend
// This script runs once before any test files are executed.
// We load .env.test directly here (not through env.js) because:
// - globalSetup runs in the main process, not a Vitest worker
// - ESM imports are hoisted, so process.env assignment before import is unreliable
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envTestPath = resolve(__dirname, '../.env.test');
dotenvConfig({ path: envTestPath, override: true });


export default async function setup() {
  console.log('Running global test setup...');
  try {
    console.log('Pushing Prisma database schema...');
    // Use prisma db push to ensure the test database matches the schema.
    // --skip-generate avoids regenerating the client (already built).
    execSync('npx prisma db push --skip-generate', { stdio: 'ignore' });
    console.log('Database schema push successful.');
  } catch (error) {
    console.error('Failed to push database schema:', error);
    // Exit with failure to stop test execution.
    process.exit(1);
  }
}
