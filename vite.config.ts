import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api/v2': {
        target: 'https://bitcoin.atomicwallet.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        headers: {
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        timeout: 30000
      },
      '/block_api': {
        target: 'https://blockchain.info',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/block_api/, ''),
        headers: {
          'Accept': 'application/json',
          'Connection': 'keep-alive'
        },
        timeout: 30000
      }
    },
    host: true,
    port: 9000
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/js/[name].js',
        chunkFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (/\.(css)$/.test(assetInfo.name ?? '')) {
            return 'assets/css/[name].[ext]';
          }
          if (/\.(ico|png|jpg|jpeg|gif|svg|webp)$/.test(assetInfo.name ?? '')) {
            return 'assets/img/[name].[ext]';
          }
          return 'assets/[name].[ext]';
        },
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  publicDir: 'public',
});