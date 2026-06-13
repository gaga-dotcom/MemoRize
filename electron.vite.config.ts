import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    // externalizeDepsPlugin marks all node_modules as external — they are loaded
    // at runtime from the actual node_modules folder, not bundled into the output.
    // This is critical for sql.js so its WASM file can be resolved correctly.
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/main/index.ts') },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'electron/preload/index.ts') },
      },
    },
  },
  renderer: {
    root: '.',
    build: {
      rollupOptions: {
        input: { index: resolve(__dirname, 'index.html') },
      },
    },
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    plugins: [react()],
  },
});
