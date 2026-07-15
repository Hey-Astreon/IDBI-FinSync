import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Use esbuild for fast minification (built-in, no extra dep needed)
    minify: 'esbuild',
    // Raise chunk warning limit to reduce noise for large pages
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor chunks for optimal long-term browser caching
        manualChunks(id) {
          // React core – cached forever, changes rarely
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          // Zustand state management
          if (id.includes('node_modules/zustand')) {
            return 'vendor-state';
          }
          // Axios HTTP client
          if (id.includes('node_modules/axios')) {
            return 'vendor-http';
          }
          // Lucide icons – large bundle, changes rarely
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
        // Deterministic asset file names with content hashes for CDN caching
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'chunks/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
