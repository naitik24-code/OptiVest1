import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000';
  return {
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target: apiTarget, changeOrigin: true } },
    },
    preview: { host: '0.0.0.0', port: 4173, strictPort: true },
    build: { sourcemap: mode !== 'production', chunkSizeWarningLimit: 900 },
  };
});
