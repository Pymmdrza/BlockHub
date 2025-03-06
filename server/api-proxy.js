// This file would be used in a Node.js server environment
// For development, we'll use Vite's proxy feature

const express = require('express');
const axios = require('axios');
const router = express.Router();

// Cache for GitHub API responses to avoid rate limiting
const apiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// GitHub API proxy endpoint
router.get('/github/rich-address-wallet/:endpoint', async (req, res) => {
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

// Generic proxy endpoint
router.get('/proxy', async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint parameter is required' });
    }
    
    // Validate endpoint to prevent server-side request forgery (SSRF)
    const allowedDomains = [
      'api.github.com',
      'api.coingecko.com',
      'blockchain.info',
      'ws.blockvhain.info',
      'btcbook.guarda.co'
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
        host: url.hostname
      },
      data: req.body
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

module.exports = router;
