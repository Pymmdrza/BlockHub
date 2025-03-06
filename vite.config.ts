import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/github/rich': {
        target: 'https://api.github.com/repos/Pymmdrza/Rich-Address-Wallet',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/github\/rich/, ''),
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'BlockHub-App/1.0'
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
          'Connection': 'keep-alive',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        timeout: 30000,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.warn('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Cache-Control', 'no-cache');
            proxyReq.setHeader('Pragma', 'no-cache');
          });
        }
      }
    },
    host: true,
    port: 9000
  }
});