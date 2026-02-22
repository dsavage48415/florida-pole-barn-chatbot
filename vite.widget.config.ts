import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite config for building the embeddable widget.js IIFE bundle.
 *
 * Run: npm run build:widget
 * Output: public/widget.js
 */
export default defineConfig({
  plugins: [react()],
  publicDir: false, // Disable publicDir to avoid conflict with outDir
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'public',
    emptyOutDir: false, // Don't delete other files in public/
    lib: {
      entry: path.resolve(__dirname, 'src/widget/entry.tsx'),
      name: 'FPBChatbot',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      // Bundle everything — no external dependencies
      external: [],
      output: {
        // Ensure single file output
        inlineDynamicImports: true,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
