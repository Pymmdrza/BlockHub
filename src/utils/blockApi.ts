import axios from 'axios';
import { BlockInfo, BlockData, NetworkInfo, ChartDataPoint } from '../types';

// Base URL for blockchain.info API
const BLOCKCHAIN_API_URL = '/block_api';

// User agents to rotate for API requests
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

// Get a random user agent to avoid rate limiting
const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// Create axios instance for blockchain.info API
const blockchainApi = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000, // Reduced timeout to 5 seconds
  validateStatus: (status) => status >= 200 && status < 500
});

// Add request interceptor to rotate User-Agent
blockchainApi.interceptors.request.use((config) => {
  config.headers['User-Agent'] = getRandomUserAgent();
  return config;
});

/**
 * Fetch latest blocks from blockchain.info API
 * @param limit Number of blocks to fetch
 * @returns Promise with array of BlockData objects
 */
export const fetchLatestBlocks = async (limit: number = 10): Promise<BlockData[]> => {
  try {
    // Use blockchain.info blocks endpoint
    const response = await blockchainApi.get('/blocks?format=json', {
      timeout: 5000
    });
    
    if (!response.data || !Array.isArray(response.data.blocks)) {
      console.warn('Invalid block data format received, falling back to mock data');
      return generateMockBlocks(limit);
    }
    
    // Process and return the blocks
    const blocks = response.data.blocks.slice(0, limit).map((block: any) => ({
      hash: block.hash || '',
      height: block.height || 0,
      time: block.time || Math.floor(Date.now() / 1000),
      size: block.size || 0,
      txCount: block.n_tx || 0,
      miner: extractMinerFromCoinbase(block.miner || '')
    }));
    
    return blocks;
  } catch (error) {
    console.error('Error fetching latest blocks:', error);
    
    // Return mock data if API fails
    return generateMockBlocks(limit);
  }
};

/**
 * Fetch details for a specific block by hash or height
 * @param hashOrHeight Block hash or height
 * @returns Promise with BlockInfo object
 */
export const fetchBlockDetails = async (hashOrHeight: string): Promise<BlockInfo> => {
  try {
    // Determine if we're looking up by hash or height
    const isHeight = /^\d+$/.test(hashOrHeight);
    
    if (isHeight) {
      // If looking up by height, first get the block hash
      const heightResponse = await blockchainApi.get(`/block-height/${hashOrHeight}?format=json`, {
        timeout: 5000
      });
      
      if (!heightResponse.data?.blocks || !heightResponse.data.blocks[0]) {
        console.warn('Block not found by height, falling back to mock data');
        return generateMockBlockDetails(hashOrHeight);
      }
      
      // Use the hash from the height lookup
      hashOrHeight = heightResponse.data.blocks[0].hash;
    }
    
    // Now fetch the block details by hash
    const response = await blockchainApi.get(`/rawblock/${hashOrHeight}?format=json`, {
      timeout: 5000
    });
    
    if (!response.data || !response.data.hash) {
      console.warn('Invalid block data received, falling back to mock data');
      return generateMockBlockDetails(hashOrHeight);
    }
    
    const blockData = response.data;
    
    // Process transactions
    const transactions = blockData.tx ? blockData.tx.map((tx: any) => ({
      hash: tx.hash || '',
      size: tx.size || 0,
      fee: tx.fee || 0,
      inputs: tx.inputs || [],
      out: tx.out || []
    })) : [];
    
    // Process and return the block details
    const blockInfo: BlockInfo = {
      hash: blockData.hash || '',
      height: blockData.height || 0,
      time: blockData.time || Math.floor(Date.now() / 1000),
      size: blockData.size || 0,
      txCount: blockData.n_tx || 0,
      miner: extractMinerFromCoinbase(blockData.miner || ''),
      prevBlockHash: blockData.prev_block || '',
      nextBlockHash: null, // API doesn't provide this directly
      merkleRoot: blockData.mrkl_root || '',
      version: blockData.ver || 0,
      bits: blockData.bits || '',
      nonce: blockData.nonce || 0,
      weight: blockData.weight || 0,
      difficulty: blockData.difficulty || 0,
      reward: calculateBlockReward(blockData.height),
      transactions: transactions
    };
    
    // Try to get the next block hash if available
    try {
      const nextBlockResponse = await blockchainApi.get(`/block-height/${blockInfo.height + 1}?format=json`, {
        timeout: 3000
      });
      
      if (nextBlockResponse.data?.blocks && nextBlockResponse.data.blocks[0]) {
        blockInfo.nextBlockHash = nextBlockResponse.data.blocks[0].hash;
      }
    } catch (error) {
      console.warn('Could not fetch next block hash');
    }
    
    return blockInfo;
  } catch (error) {
    console.error('Error fetching block details:', error);
    
    // Return mock data if API fails
    return generateMockBlockDetails(hashOrHeight);
  }
};

/**
 * Fetch network statistics from blockchain.info API
 * @returns Promise with NetworkInfo object
 */
export const fetchNetworkStats = async (): Promise<NetworkInfo> => {
  // Create a function to fetch a single API endpoint with fallback
  const fetchWithFallback = async (endpoint: string, defaultValue: any) => {
    try {
      const response = await blockchainApi.get(endpoint, { timeout: 3000 });
      return response.data;
    } catch (error) {
      console.warn(`Failed to fetch ${endpoint}, using default value`);
      return defaultValue;
    }
  };

  try {
    // Fetch stats in parallel
    const [
      stats,
      latestBlock,
      difficulty,
      hashRate,
      unconfirmedCount,
      blockCount,
      marketPrice,
      txCount24h,
      avgBlockSize
    ] = await Promise.all([
      fetchWithFallback('/stats?format=json', null),
      fetchWithFallback('/latestblock?format=json', null),
      fetchWithFallback('/q/getdifficulty', 78.3),
      fetchWithFallback('/q/hashrate', 350000000),
      fetchWithFallback('/q/unconfirmedcount', 12500),
      fetchWithFallback('/q/getblockcount', 800000),
      fetchWithFallback('/ticker', null),
      fetchWithFallback('/q/24hrtransactioncount', 350000),
      fetchWithFallback('/q/24hravgblocksize', 1500000)
    ]);
    
    // If we couldn't get the basic stats, use mock data
    if (!stats) {
      console.warn('Failed to fetch basic network stats, using mock data');
      return generateMockNetworkStats();
    }
    
    // Get current Bitcoin price from ticker
    const btcPrice = marketPrice?.USD?.last || 65000;
    
    // Parse numeric values
    const difficultyValue = parseFloat(difficulty) || 78.3;
    const hashRateGH = parseFloat(hashRate) || 350000000;
    const unconfirmedTxs = parseInt(unconfirmedCount, 10) || 12500;
    const blockHeight = parseInt(blockCount, 10) || 800000;
    const txCount24hValue = parseInt(txCount24h, 10) || 350000;
    const avgBlockSizeValue = parseInt(avgBlockSize, 10) || 1500000;
    
    // Convert hash rate from GH/s to EH/s
    const hashRateEH = hashRateGH / 1000000;
    
    // Calculate next retarget block
    const nextRetargetBlock = Math.ceil(blockHeight / 2016) * 2016;
    
    // Get mempool size from stats
    const mempoolSize = stats.mempool_size || 250;
    
    // Get average block time
    const avgBlockTime = stats.minutes_between_blocks || 10;
    
    // Calculate average transaction fee based on recent transactions
    const avgTransactionFee = stats.total_fees_btc 
      ? (stats.total_fees_btc / stats.n_tx) || 0.0002 
      : 0.0002;
    
    // Get latest block hash
    const latestBlockHash = latestBlock?.hash || '';
    
    // Calculate market cap
    const marketCap = btcPrice * (stats.totalbc || 19500000);
    
    // Calculate BTC sent in last 24h
    const btcSent24h = stats.total_btc_sent || 250000;
    
    // Process and return the network stats
    return {
      timestamp: Date.now(),
      hashRate: hashRateEH,
      difficulty: difficultyValue,
      unconfirmedTxs: unconfirmedTxs,
      blockHeight: blockHeight,
      latestBlockHash: latestBlockHash,
      nextRetargetBlock: nextRetargetBlock,
      mempoolSize: mempoolSize,
      totalTransactions: stats.n_tx_total || 850000000,
      avgBlockTime: avgBlockTime,
      avgTransactionFee: avgTransactionFee,
      marketCap: marketCap,
      txCount24h: txCount24hValue,
      btcSent24h: btcSent24h
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    
    // Return mock data if API fails
    return generateMockNetworkStats();
  }
};

/**
 * Fetch mempool information from blockchain.info API
 * @returns Promise with mempool data
 */
export const fetchMempoolInfo = async () => {
  try {
    // Get unconfirmed transactions count and mempool size
    const [unconfirmedCount, stats] = await Promise.all([
      blockchainApi.get('/q/unconfirmedcount', { timeout: 3000 }),
      blockchainApi.get('/stats?format=json', { timeout: 3000 })
    ]);
    
    const count = parseInt(unconfirmedCount.data, 10) || 12500;
    const size = stats.data?.mempool_size || 250;
    
    return {
      size: size * 1024 * 1024, // Convert MB to bytes
      bytes: size * 1024 * 1024,
      count: count,
      fee_levels: [
        { fee: 0.00015, size: Math.floor(size * 0.2) * 1024 * 1024 }, // High priority
        { fee: 0.0001, size: Math.floor(size * 0.3) * 1024 * 1024 },  // Medium priority
        { fee: 0.00005, size: Math.floor(size * 0.3) * 1024 * 1024 }, // Low priority
        { fee: 0.00001, size: Math.floor(size * 0.2) * 1024 * 1024 }  // Very low priority
      ]
    };
  } catch (error) {
    console.error('Error fetching mempool info:', error);
    
    // Return mock data if API fails
    return generateMockMempoolInfo();
  }
};

/**
 * Generate chart data for network statistics
 * @param dataPoints Number of data points to generate
 * @returns Object with chart data
 */
export const generateNetworkChartData = (dataPoints: number = 20): {
  hashRate: ChartDataPoint[];
  difficulty: ChartDataPoint[];
  mempool: ChartDataPoint[];
  fees: ChartDataPoint[];
} => {
  const now = Date.now();
  
  // Generate hash rate data (EH/s)
  const hashRate = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: now - (dataPoints - 1 - i) * 60000,
    value: 350 + Math.random() * 10
  }));
  
  // Generate difficulty data (T)
  const difficulty = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: now - (dataPoints - 1 - i) * 60000,
    value: 78 + Math.random() * 1
  }));
  
  // Generate mempool size data (MB)
  const mempool = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: now - (dataPoints - 1 - i) * 60000,
    value: 240 + Math.random() * 20
  }));
  
  // Generate fee data (BTC)
  const fees = Array.from({ length: dataPoints }, (_, i) => ({
    timestamp: now - (dataPoints - 1 - i) * 60000,
    value: 0.0002 + Math.random() * 0.0001
  }));
  
  return { hashRate, difficulty, mempool, fees };
};

// Helper functions

/**
 * Extract miner name from coinbase data
 * @param coinbaseData Coinbase data string
 * @returns Miner name
 */
const extractMinerFromCoinbase = (coinbaseData: string): string => {
  // Common mining pools
  const miningPools: Record<string, string> = {
    '/Foundry/': 'Foundry USA',
    '/F2Pool/': 'F2Pool',
    '/AntPool/': 'AntPool',
    '/ViaBTC/': 'ViaBTC',
    '/Binance/': 'Binance Pool',
    '/SlushPool/': 'SlushPool',
    '/Poolin/': 'Poolin',
    '/SBI Crypto/': 'SBI Crypto'
  };
  
  // Check if coinbase data contains any known mining pool identifier
  for (const [identifier, poolName] of Object.entries(miningPools)) {
    if (coinbaseData.includes(identifier)) {
      return poolName;
    }
  }
  
  // If no match, return the coinbase data or Unknown
  return coinbaseData || 'Unknown';
};

/**
 * Calculate block reward based on height
 * @param height Block height
 * @returns Block reward in BTC
 */
const calculateBlockReward = (height: number): number => {
  const halvings = Math.floor(height / 210000);
  if (halvings >= 64) return 0; // After 64 halvings, reward is 0
  
  return 50 / Math.pow(2, halvings);
};

// Mock data generators

/**
 * Generate mock blocks for testing
 * @param count Number of blocks to generate
 * @returns Array of BlockData objects
 */
const generateMockBlocks = (count: number): Promise<BlockData[]> => {
  // Try to get the latest block height from the API first
  return blockchainApi.get('/q/getblockcount', { timeout: 2000 })
    .then(response => {
      const latestHeight = parseInt(response.data, 10);
      return generateMockBlocksWithHeight(count, isNaN(latestHeight) ? 800000 : latestHeight);
    })
    .catch(() => {
      // If API call fails, use a default height
      return generateMockBlocksWithHeight(count, 800000);
    });
};

/**
 * Generate mock blocks with a specific starting height
 * @param count Number of blocks to generate
 * @param startHeight Starting block height
 * @returns Array of BlockData objects
 */
const generateMockBlocksWithHeight = (count: number, startHeight: number): BlockData[] => {
  const mockBlocks: BlockData[] = [];
  
  const miners = [
    'Foundry USA',
    'AntPool',
    'F2Pool',
    'Binance Pool',
    'ViaBTC',
    'SlushPool',
    'Unknown'
  ];
  
  for (let i = 0; i < count; i++) {
    const height = startHeight - i;
    const time = Math.floor(Date.now() / 1000) - (i * 600); // Approximately 10 minutes per block
    const txCount = 1000 + Math.floor(Math.random() * 2000);
    const size = txCount * 500 + Math.floor(Math.random() * 500000);
    
    mockBlocks.push({
      hash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
      height,
      time,
      size,
      txCount,
      miner: miners[Math.floor(Math.random() * miners.length)]
    });
  }
  
  return mockBlocks;
};

/**
 * Generate mock block details for testing
 * @param hashOrHeight Block hash or height
 * @returns BlockInfo object
 */
const generateMockBlockDetails = (hashOrHeight: string): BlockInfo => {
  const isHeight = /^\d+$/.test(hashOrHeight);
  const height = isHeight ? parseInt(hashOrHeight, 10) : 800000 - Math.floor(Math.random() * 100);
  const hash = isHeight ? `000000000000000000${Math.random().toString(16).substring(2, 14)}` : hashOrHeight;
  
  // Generate mock transactions
  const txCount = 2000 + Math.floor(Math.random() * 1000);
  const transactions = [];
  
  for (let i = 0; i < Math.min(txCount, 100); i++) {
    const txHash = `${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
    const size = 500 + Math.floor(Math.random() * 1500);
    const fee = Math.random() * 0.001;
    
    // Generate inputs
    const inputCount = Math.floor(Math.random() * 5) + 1;
    const inputs = [];
    
    for (let j = 0; j < inputCount; j++) {
      const addr = `1${Math.random().toString(36).substring(2, 15)}`;
      const value = Math.floor(Math.random() * 10000000);
      
      inputs.push({
        prev_out: {
          addr,
          value,
          n: j,
          script: '',
          spent: true,
          tx_index: Math.floor(Math.random() * 1000000)
        },
        script: '',
        sequence: 0
      });
    }
    
    // Generate outputs
    const outputCount = Math.floor(Math.random() * 5) + 1;
    const outputs = [];
    
    for (let j = 0; j < outputCount; j++) {
      const addr = `1${Math.random().toString(36).substring(2, 15)}`;
      const value = Math.floor(Math.random() * 1000000);
      
      outputs.push({
        addr,
        value,
        n: j,
        script: '',
        spent: false,
        tx_index: Math.floor(Math.random() * 1000000)
      });
    }
    
    transactions.push({
      hash: txHash,
      size,
      fee,
      inputs,
      out: outputs
    });
  }
  
  return {
    hash,
    prevBlockHash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
    nextBlockHash: Math.random() > 0.2 ? `000000000000000000${Math.random().toString(16).substring(2, 14)}` : null,
    height,
    time: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 86400),
    size: 1000000 + Math.floor(Math.random() * 500000),
    weight: 4000000 + Math.floor(Math.random() * 2000000),
    version: 0x20000000,
    merkleRoot: `${Math.random().toString(16).substring(2, 66)}`,
    nonce: Math.floor(Math.random() * 1000000000),
    bits: '1a0ff55e',
    difficulty: 78.3 + Math.random() * 1,
    transactions,
    txCount,
    miner: ['Foundry USA', 'AntPool', 'F2Pool', 'Binance Pool', 'ViaBTC'][Math.floor(Math.random() * 5)],
    reward: calculateBlockReward(height)
  };
};

/**
 * Generate mock network stats for testing
 * @returns NetworkInfo object
 */
const generateMockNetworkStats = (): Promise<NetworkInfo> => {
  // Try to get the latest block height from the API first
  return blockchainApi.get('/q/getblockcount', { timeout: 2000 })
    .then(response => {
      const latestHeight = parseInt(response.data, 10);
      return generateMockNetworkStatsWithHeight(isNaN(latestHeight) ? 800000 : latestHeight);
    })
    .catch(() => {
      // If API call fails, use a default height
      return generateMockNetworkStatsWithHeight(800000);
    });
};

/**
 * Generate mock network stats with a specific block height
 * @param blockHeight Block height to use
 * @returns NetworkInfo object
 */
const generateMockNetworkStatsWithHeight = (blockHeight: number): NetworkInfo => {
  const mockLatestHash = `000000000000000000${Math.random().toString(16).substring(2, 14)}`;
  
  return {
    timestamp: Date.now(),
    hashRate: 350.5 + Math.random() * 10,
    difficulty: 78.3 + Math.random() * 1,
    unconfirmedTxs: 12500 + Math.floor(Math.random() * 1000),
    blockHeight,
    latestBlockHash: mockLatestHash,
    nextRetargetBlock: Math.ceil(blockHeight / 2016) * 2016,
    mempoolSize: 250 + Math.random() * 20,
    totalTransactions: 850000000 + Math.floor(Math.random() * 1000000),
    avgBlockTime: 9.8 + Math.random() * 0.4,
    avgTransactionFee: 0.00023 + Math.random() * 0.0001,
    marketCap: 1200000000000 + Math.random() * 50000000000,
    txCount24h: 350000 + Math.floor(Math.random() * 50000),
    btcSent24h: 250000 + Math.floor(Math.random() * 50000)
  };
};

/**
 * Generate mock mempool info for testing
 * @returns Mock mempool info object
 */
const generateMockMempoolInfo = () => {
  return {
    size: 250 * 1024 * 1024, // 250 MB
    bytes: 250 * 1024 * 1024,
    count: 12500,
    fee_levels: [
      { fee: 0.00015, size: 50 * 1024 * 1024 },  // High priority
      { fee: 0.0001, size: 75 * 1024 * 1024 },   // Medium priority
      { fee: 0.00005, size: 75 * 1024 * 1024 },  // Low priority
      { fee: 0.00001, size: 50 * 1024 * 1024 }   // Very low priority
    ]
  };
};

export default {
  fetchLatestBlocks,
  fetchBlockDetails,
  fetchNetworkStats,
  fetchMempoolInfo,
  generateNetworkChartData
};
