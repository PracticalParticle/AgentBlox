import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@server': path.resolve(__dirname, './server'),
    },
  },
  test: {
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['server/**/*.ts', 'src/lib/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', 'server/index.ts'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.{test,spec}.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'client',
          environment: 'jsdom',
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
    ],
  },
});
