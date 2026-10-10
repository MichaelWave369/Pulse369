import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: '/Pulse369/',
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('../dist-pages/', import.meta.url)),
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('index.html', import.meta.url)),
        quest: fileURLToPath(new URL('quest.html', import.meta.url)),
      },
    },
  },
});