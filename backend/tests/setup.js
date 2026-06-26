import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try resolving .env.test from multiple potential locations depending on CWD
const pathsToTry = [
  path.resolve(process.cwd(), 'backend/.env.test'),
  path.resolve(process.cwd(), '.env.test'),
  path.resolve(__dirname, '../.env.test'),
];

let envLoaded = false;
for (const envPath of pathsToTry) {
  const result = dotenv.config({
    path: envPath,
    override: true,
  });

  if (result.parsed) {
    for (const k in result.parsed) {
      process.env[k] = result.parsed[k];
    }
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  console.warn('⚠️ Warning: Could not locate .env.test in any configuration path.');
}
