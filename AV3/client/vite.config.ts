import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '/docs': 'http://localhost:3000'
    }
  }
});
