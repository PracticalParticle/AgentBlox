import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dynamic SDK requires Node globals that Vite does not provide by default.
// See: https://www.dynamic.xyz/docs/react/reference/quickstart
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';
const isDocker = process.env.DOCKER === '1';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: isDocker ? '0.0.0.0' : true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  },
});
