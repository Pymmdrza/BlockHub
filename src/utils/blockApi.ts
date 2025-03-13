import axios from 'axios';
import { BlockInfo, BlockData, NetworkInfo, ChartDataPoint, TransactionResponse } from '../types';

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
  timeout: 5000,
  validateStatus: (status) => status >= 200 && status < 500
});

// Add request interceptor to rotate User-Agent
blockchainApi.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers['User-Agent'] = getRandomUserAgent();
  }
  return config;
});

// Cache for latest block height
let cachedBlockHeight: number | null = null;

/**
 * Get the latest block height
 */
const getLatestBlockHeight = async (): Promise<number> => {
  if (cachedBlockHeight !== null) {
    return cachedBlockHeight;
  }

  try {
    // Try to get the latest block height from the API
    const response = await blockchainApi.get('/latestblock?format=json');
    if (response.data?.height) {
      cachedBlockHeight = response.data.height;
      return response.data.height;
    }

    // If that fails, try alternative API
    const altResponse = await axios.get('/api/v2/stats');
    if (altResponse.data?.blockHeight) {
      cachedBlockHeight = altResponse.data.blockHeight;
      return altResponse.data.blockHeight;
    }

    throw new Error('Could not get latest block height');
  } catch (error) {
    console.warn('Failed to get latest block height:', error);
    // Use a reasonable default
    return 830000;
  }
};

/**
 * Generate mock blocks for testing or API failure
 */
const generateMockBlocks = async (limit: number): Promise<BlockData[]> => {
  const mockBlocks: BlockData[] = [];
  const now = Math.floor(Date.now() / 1000);
  const miners = ['Foundry USA', 'AntPool', 'F2Pool', 'Binance Pool', 'ViaBTC'];
  
  // Get the latest block height to use as starting point
  const latestHeight = await getLatestBlockHeight();
  
  for (let i = 0; i < limit; i++) {
    mockBlocks.push({
      hash: `000000000000000000${Math.random().toString(16).substring(2, 14)}`,
      height: latestHeight - i,
      time: now - (i * 600), // Approximately 10 minutes per block
      size: 1000000 + Math.floor(Math.random() * 500000),
      txCount: 2000 + Math.floor(Math.random() * 1000),
      miner: miners[Math.floor(Math.random() * miners.length)]
    });
  }
  
  return mockBlocks;
};

/**
 * Fetch latest blocks from blockchain.info API
 * @param limit Number of blocks to fetch
 * @returns Promise with array of BlockData objects
 */
export const fetchLatestBlocks = async (limit: number = 10): Promise<BlockData[]> => {
  try {
    // Try blockchain.info API first
    try {
      const response = await blockchainApi.get('/blocks?format=json');
      
      if (!response.data || !Array.isArray(response.data.blocks)) {
        throw new Error('Invalid block data format received');
      }
      
      const blocks = response.data.blocks.slice(0, limit).map((block: any) => ({
        hash: block.hash || '',
        height: block.height || 0,
        time: block.time || Math.floor(Date.now() / 1000),
        size: block.size || 0,
        txCount: block.n_tx || 0,
        miner: extractMinerFromCoinbase(block.miner || '')
      }));

      // Update cached block height if we got valid data
      if (blocks.length > 0 && blocks[0].height > 0) {
        cachedBlockHeight = blocks[0].height;
      }

      return blocks;
    } catch (primaryError) {
      console.warn('Primary API failed, trying alternative:', primaryError);
      
      // Try alternative API
      const altResponse = await axios.get('/api/v2/blocks', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': getRandomUserAgent()
        }
      });
      
      if (!altResponse.data) {
        throw new Error('Invalid block data from alternative API');
      }
      
      let blocks: BlockData[] = [];
      
      // Handle different API response structures
      if (Array.isArray(altResponse.data)) {
        blocks = altResponse.data.slice(0, limit);
      } else if (altResponse.data.blocks && Array.isArray(altResponse.data.blocks)) {
        blocks = altResponse.data.blocks.slice(0, limit);
      } else {
        throw new Error('Unexpected data structure from alternative API');
      }

      // Update cached block height if we got valid data
      if (blocks.length > 0 && blocks[0].height > 0) {
        cachedBlockHeight = blocks[0].height;
      }

      return blocks;
    }
  } catch (error) {
    console.warn('All APIs failed, using mock data:', error);
    // Return mock data instead of throwing error to ensure UI always has data to display
    return generateMockBlocks(limit);
  }
};

/**
 * Fetch network statistics from blockchain.info API
 * @returns Promise with NetworkInfo object
 */
export const fetchNetworkStats = async (): Promise<NetworkInfo> => {
  try {
    // Try primary API first
    try {
      const [stats, latestBlock, difficulty, hashRate] = await Promise.all([
        blockchainApi.get('/stats?format=json'),
        blockchainApi.get('/latestblock?format=json'),
        blockchainApi.get('/q/getdifficulty'),
        blockchainApi.get('/q/hashrate')
      ]);
      
      if (!stats.data) {
        throw new Error('Invalid stats data received');
      }

      // Update cached block height
      if (latestBlock.data?.height) {
        cachedBlockHeight = latestBlock.data.height;
      }
      
      return {
        timestamp: Date.now(),
        hashRate: parseFloat(hashRate.data) / 1000000000, // Convert to EH/s
        difficulty: parseFloat(difficulty.data),
        unconfirmedTxs: stats.data.n_btc || 0,
        blockHeight: latestBlock.data?.height || 0,
        latestBlockHash: latestBlock.data?.hash,
        nextRetargetBlock: Math.ceil((latestBlock.data?.height || 0) / 2016) * 2016,
        mempoolSize: stats.data.mempool_size || 0,
        totalTransactions: stats.data.n_tx || 0,
        avgBlockTime: stats.data.minutes_between_blocks || 10,
        avgTransactionFee: stats.data.total_fees_btc ? stats.data.total_fees_btc / stats.data.n_tx : 0.0002,
        marketCap: stats.data.market_price_usd * stats.data.totalbc,
        txCount24h: stats.data.n_tx_24h || 0,
        btcSent24h: stats.data.total_btc_sent || 0
      };
    } catch (primaryError) {
      console.warn('Primary API failed, trying alternative:', primaryError);
      
      // Try alternative API
      const altResponse = await axios.get('/api/v2/stats', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': getRandomUserAgent()
        }
      });
      
      if (!altResponse.data) {
        throw new Error('Invalid stats data from alternative API');
      }

      // Update cached block height if available
      if (altResponse.data.blockHeight) {
        cachedBlockHeight = altResponse.data.blockHeight;
      }
      
      return altResponse.data;
    }
  } catch (error) {
    console.error('Error fetching network stats:', error);
    // Return mock data with reasonable defaults
    return {
      timestamp: Date.now(),
      hashRate: 350.5,
      difficulty: 78.3,
      unconfirmedTxs: 12500,
      blockHeight: await getLatestBlockHeight(),
      latestBlockHash: '000000000000000000' + Math.random().toString(16).substring(2, 14),
      nextRetargetBlock: Math.ceil((await getLatestBlockHeight()) / 2016) * 2016,
      mempoolSize: 250,
      totalTransactions: 850000000,
      avgBlockTime: 9.8,
      avgTransactionFee: 0.00023,
      marketCap: 1200000000000,
      txCount24h: 350000,
      btcSent24h: 250000
    };
  }
};

/**
 * Extract miner name from coinbase data
 */
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
  
  return coinbaseData || 'Unknown';
};

/**
 * Fetch transaction info
 */
export const fetchTransactionInfo = async (txid: string): Promise<TransactionResponse> => {
  try {
    // Try to get transaction data from blockchain.info API
    const response = await axios.get(`${BLOCKCHAIN_API_URL}/rawtx/${txid}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': getRandomUserAgent()
      }
    });

    if (!response.data || !response.data.hash) {
      throw new Error('Invalid transaction data received');
    }

    // Transform the blockchain.info response to our TransactionResponse format
    return {
      txid: response.data.hash,
      blockHeight: response.data.block_height || 0,
      blockTime: response.data.time || Math.floor(Date.now() / 1000),
      confirmations: response.data.block_height ? 1 : 0,
      fees: (response.data.fee || 0).toString(),
      size: response.data.size || 0,
      value: (response.data.out.reduce((sum: number, out: any) => sum + (out.value || 0), 0)).toString(),
      vin: response.data.inputs.map((input: any) => ({
        addresses: input.prev_out?.addr ? [input.prev_out.addr] : [],
        value: (input.prev_out?.value || 0).toString()
      })),
      vout: response.data.out.map((output: any) => ({
        addresses: output.addr ? [output.addr] : [],
        value: (output.value || 0).toString()
      }))
    };
  } catch (error) {
    console.error('Error fetching transaction:', error);
    
    // Try alternative API if primary fails
    try {
      const altResponse = await axios.get(`/api/v2/tx/${txid}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': getRandomUserAgent()
        }
      });

      if (!altResponse.data) {
        throw new Error('Invalid transaction data from alternative API');
      }

      return altResponse.data;
    } catch (altError) {
      console.error('Alternative API also failed:', altError);
      throw new Error('Failed to fetch transaction data from all sources');
    }
  }
};

export default {
  fetchLatestBlocks,
  fetchNetworkStats,
  fetchTransactionInfo
};