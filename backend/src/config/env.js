import 'dotenv/config';

const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'LLM_API_KEY',
];

const missing = [];

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (missing.length > 0) {
  console.error('\n❌ STARTUP FAILURE: Missing required environment variables:');
  missing.forEach((key) => {
    console.error(`   - ${key}`);
  });
  console.error('The application requires these configurations to start. Please check your .env file.\n');
  process.exit(1);
}

// Export the validated environment configuration object
export const env = {
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  LLM_API_KEY: process.env.LLM_API_KEY,
};
