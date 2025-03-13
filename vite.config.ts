import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      // Proxy GitHub API requests to hide the actual API endpoint from clients
      '/api/github/rich-address-wallet': {
        target: 'https://api.github.com/repos/Pymmdrza/Rich-Address-Wallet',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github\/rich-address-wallet/, ''),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BlockHub-App/1.0'
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      },
      '/api/v2': {
        target: 'https://btcbook.guarda.co',
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
    port: 9009
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Set base path for production deployment
    base: '/',
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
