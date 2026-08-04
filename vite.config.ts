import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    strictPort: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
  },
});
