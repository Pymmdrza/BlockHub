const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

// Create Express app
const app = express();
const PORT = process.env.PORT || 80;

// Cache for GitHub API responses to avoid rate limiting
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GitHub API proxy endpoint
app.get('/api/github/rich-address-wallet/:endpoint', async (req, res) => {
  try {
    const { endpoint } = req.params;
    const cacheKey = `github-${endpoint}`;
    
    // Check cache first
    const cachedData = apiCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_TTL) {
      return res.json(cachedData.data);
    }
    
    // Make the actual request to GitHub API
    const response = await axios.get(`https://api.github.com/repos/Pymmdrza/Rich-Address-Wallet/${endpoint}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'BlockHub-App/1.0'
      }
    });
    
    // Cache the response
    apiCache.set(cacheKey, {
      timestamp: Date.now(),
      data: response.data
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('GitHub API proxy error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch data from GitHub API',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/health/status', (req, res) => {
  res.status(200).send('OK');
});

// Setup API proxies
// Bitcoin API proxy
app.use('/api/v2', createProxyMiddleware({
  target: 'https://bitcoin.atomicwallet.io',
  changeOrigin: true,
  pathRewrite: { '^/api/v2': '/api/v2' },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://atomicwallet.io/'
  },
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Accept', 'application/json');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'The server encountered a temporary error. Please try again later.'
    });
  }
}));

// Blockchain.info API proxy
app.use('/block_api', createProxyMiddleware({
  target: 'https://blockchain.info',
  changeOrigin: true,
  pathRewrite: { '^/block_api': '/' },
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  },
  onProxyReq: (proxyReq) => {
    proxyReq.setHeader('Accept', 'application/json');
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(502).json({
      error: 'Bad Gateway',
      message: 'The server encountered a temporary error. Please try again later.'
    });
  }
}));

// Generic proxy endpoint
app.get('/api/proxy', async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }
    
    // Validate endpoint to prevent server-side request forgery (SSRF)
    const allowedDomains = [
      'api.github.com',
      'blockchain.info',
      'bitcoin.atomicwallet.io'
    ];
    
    const url = new URL(endpoint);
    if (!allowedDomains.includes(url.hostname)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    
    // Forward the request
    const response = await axios({
      method: req.method,
      url: endpoint,
      headers: {
        ...req.headers,
        host: url.hostname,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(error.response?.status || 500).json({
      error: 'Proxy request failed',
      message: error.message
    });
  }
});

// CORS headers middleware
app.use((req, res, next) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization');
    res.header('Access-Control-Max-Age', '1728000');
    res.header('Content-Type', 'text/plain charset=UTF-8');
    res.header('Content-Length', '0');
    return res.status(204).send();
  }
  
  // Add CORS headers to all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Authorization');
  res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range');
  
  next();
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// Security headers
app.use((req, res, next) => {
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Content-Security-Policy', "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://bitcoin.atomicwallet.io https://blockchain.info https://api.github.com;");
  res.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// For any request that doesn't match the above, send the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});