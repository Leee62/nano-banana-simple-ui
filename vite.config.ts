import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/app-config.js': {
        target: 'http://localhost:8787',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  preview: {
    host: true,
    port: 4173
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true
  }
});
