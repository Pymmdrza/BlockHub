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
        target: 'https://btcbook.guarda.co',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/block_api': {
        target: 'https://blockchain.info',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/block-api/, '')
      }
    },
    host: true,
    origin: "0.0.0.0",
    port: 5000
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