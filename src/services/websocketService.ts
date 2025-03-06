import { BlockchainWebSocket } from './BlockchainWebSocket';

// Create WebSocket URL based on environment
const getWebSocketUrl = () => {
  // Try multiple WebSocket endpoints in order
  const endpoints = [
    'wss://ws.blockchain.info/inv',
    'wss://ws.blockstream.info/ws',
    'wss://stream.blockchain.info/inv',
    'ws://ws.blockchain.info/inv' // Fallback to non-secure for development
  ];

  // In production, prefer secure WebSocket endpoints
  if (window.location.protocol === 'https:') {
    return endpoints.filter(url => url.startsWith('wss://'));
  }

  // In development, try all endpoints
  return endpoints;
};

// Create a singleton instance with the appropriate URLs
const websocketService = new BlockchainWebSocket(getWebSocketUrl());
export default websocketService;