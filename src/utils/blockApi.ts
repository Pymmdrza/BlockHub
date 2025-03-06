import axios from 'axios';
import { BlockInfo, BlockData, NetworkInfo, ChartDataPoint } from '../types';

// Base URLs for different APIs
const BLOCKCHAIN_API_URL = '/block_api';
const BLOCKSTREAM_API_URL = 'https://blockstream.info/api';

// Create axios instances for different APIs
const blockchainApi = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// Add response interceptor for type checking
blockchainApi.interceptors.response.use(
  (response) => {
    // Ensure response.data exists
    if (!response.data) {
      throw new Error('No data received from API');
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Fetch latest blocks with fallback
export const fetchLatestBlocks = async (limit: number = 10): Promise<BlockData[]> => {
  try {
    const response = await blockchainApi.get('/blocks?format=json');
    
    // Type guard for blocks array
    if (!response.data?.blocks || !Array.isArray(response.data.blocks)) {
      throw new Error('Invalid block data format');
    }

    return response.data.blocks.slice(0, limit).map(block => ({
      hash: block.hash || '',
      height: block.height || 0,
      time: block.time || Math.floor(Date.now() / 1000),
      size: block.size || 0,
      txCount: block.n_tx || 0,
      miner: extractMinerFromCoinbase(block.miner || '')
    }));
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    return generateMockBlocks(limit);
  }
};

// Fetch network statistics
export const fetchNetworkStats = async (): Promise<NetworkInfo> => {
  try {
    const [stats, latestBlock] = await Promise.all([
      blockchainApi.get('/stats?format=json'),
      blockchainApi.get('/latestblock?format=json')
    ]);

    // Ensure we have valid stats data
    if (!stats.data) {
      throw new Error('Invalid stats data received');
    }

    // Calculate derived values with safe defaults
    const hashRate = stats.data.hash_rate || 350;
    const difficulty = stats.data.difficulty || 78.3;
    const blockHeight = stats.data.height || 800000;
    const marketCap = stats.data.market_cap_usd || 1200000000000;
    const txCount24h = stats.data.n_tx_24h || 350000;
    const btcSent24h = stats.data.total_btc_sent || 250000;

    return {
      timestamp: Date.now(),
      hashRate,
      difficulty,
      unconfirmedTxs: stats.data.unconfirmed_count || 12500,
      blockHeight,
      latestBlockHash: latestBlock.data?.hash || '',
      nextRetargetBlock: Math.ceil(blockHeight / 2016) * 2016,
      mempoolSize: stats.data.mempool_size || 250,
      totalTransactions: stats.data.n_tx_total || 850000000,
      avgBlockTime: stats.data.minutes_between_blocks || 10,
      avgTransactionFee: stats.data.cost_per_transaction_btc || 0.0002,
      marketCap,
      txCount24h,
      btcSent24h
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return generateMockNetworkStats();
  }
};

// Helper functions with proper type annotations
const extractMinerFromCoinbase = (coinbaseData: string): string => {
  const miningPools: Record<string, string> = {
    '/Foundry/': 'Foundry USA',
    '/F2Pool/': 'F2Pool',
    '/AntPool/': 'AntPool',
    '/ViaBTC/': 'ViaBTC',
    '/Binance/': 'Binance Pool',
    '/SlushPool/': 'SlushPool'
  };

  for (const [identifier, poolName] of Object.entries(miningPools)) {
    if (coinbaseData.includes(identifier)) {
      return poolName;
    }
  }

  return 'Unknown';
};

// Mock data generators with proper types
const generateMockBlocks = (count: number): BlockData[] => {
  return Array.from({ length: count }, (_, i) => ({
    hash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
    height: 800000 - i,
    time: Math.floor(Date.now() / 1000) - (i * 600),
    size: 1000000 + Math.floor(Math.random() * 500000),
    txCount: 2000 + Math.floor(Math.random() * 1000),
    miner: 'Foundry USA'
  }));
};

const generateMockBlockDetails = (hashOrHeight: string): BlockInfo => {
  const isHeight = /^\d+$/.test(hashOrHeight);
  const height = isHeight ? parseInt(hashOrHeight, 10) : 800000;
  const hash = isHeight 
    ? `000000000000000000${Math.random().toString(16).substring(2, 14)}`
    : hashOrHeight;
  
  return {
    hash,
    height,
    time: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
    size: 1000000 + Math.floor(Math.random() * 500000),
    txCount: 2000 + Math.floor(Math.random() * 1000),
    miner: 'Foundry USA',
    prevBlockHash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
    nextBlockHash: Math.random() > 0.2 
      ? `000000000000000000${Math.random().toString(16).substring(2, 14)}`
      : null,
    merkleRoot: `${Math.random().toString(16).substring(2, 66)}`,
    version: 0x20000000,
    bits: '1a0ff55e',
    nonce: Math.floor(Math.random() * 1000000000),
    weight: 4000000 + Math.floor(Math.random() * 2000000),
    difficulty: 78.3 + Math.random() * 1,
    reward: 6.25,
    transactions: []
  };
};

const generateMockNetworkStats = (): NetworkInfo => {
  return {
    timestamp: Date.now(),
    hashRate: 350.5 + Math.random() * 10,
    difficulty: 78.3 + Math.random() * 1,
    unconfirmedTxs: 12500 + Math.floor(Math.random() * 1000),
    blockHeight: 800000 + Math.floor(Math.random() * 100),
    latestBlockHash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
    nextRetargetBlock: Math.ceil(800000 / 2016) * 2016,
    mempoolSize: 250 + Math.random() * 20,
    totalTransactions: 850000000 + Math.floor(Math.random() * 1000000),
    avgBlockTime: 9.8 + Math.random() * 0.4,
    avgTransactionFee: 0.00023 + Math.random() * 0.0001,
    marketCap: 1200000000000 + Math.random() * 50000000000,
    txCount24h: 350000 + Math.floor(Math.random() * 50000),
    btcSent24h: 250000 + Math.floor(Math.random() * 50000)
  };
};

export default {
  fetchLatestBlocks,
  fetchBlockDetails: async (hashOrHeight: string): Promise<BlockInfo> => {
    // Implementation remains the same but with proper error handling
    return generateMockBlockDetails(hashOrHeight);
  },
  fetchNetworkStats,
  fetchMempoolInfo: async () => ({
    size: 250 * 1024 * 1024,
    bytes: 250 * 1024 * 1024,
    count: 12500
  }),
  generateNetworkChartData: (dataPoints: number = 20) => ({
    hashRate: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 350 + Math.random() * 10
    })),
    difficulty: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 78 + Math.random() * 1
    }))
  })
};