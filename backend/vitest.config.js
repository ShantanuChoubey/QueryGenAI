import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: { NODE_ENV: 'test' },
    setupFiles: ['./tests/setup.js'],
    globalSetup: './tests/globalSetup.js',
  },
});
