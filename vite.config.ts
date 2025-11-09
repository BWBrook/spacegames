import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,       // let Windows reach the dev server from WSL
    strictPort: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
  },
});
