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

const blockstreamApi = axios.create({
  baseURL: BLOCKSTREAM_API_URL,
  timeout: 5000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
  }
});

// Helper function to extract miner name from coinbase data
const extractMinerFromCoinbase = (coinbaseData: string): string => {
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
  
  for (const [identifier, poolName] of Object.entries(miningPools)) {
    if (coinbaseData.includes(identifier)) {
      return poolName;
    }
  }
  
  return coinbaseData || 'Unknown';
};

// Helper function to calculate block reward
const calculateBlockReward = (height: number): number => {
  const halvings = Math.floor(height / 210000);
  if (halvings >= 64) return 0;
  return 50 / Math.pow(2, halvings);
};

// Fetch latest blocks with fallback
export const fetchLatestBlocks = async (limit: number = 10): Promise<BlockData[]> => {
  const sources = [
    // Primary source: blockchain.info
    async () => {
      const response = await blockchainApi.get('/blocks?format=json');
      if (!response.data?.blocks || !Array.isArray(response.data.blocks)) {
        throw new Error('Invalid block data format from blockchain.info');
      }
      return response.data.blocks;
    },
    
    // Fallback source: blockstream.info
    async () => {
      const response = await blockstreamApi.get('/blocks/tip/height');
      const tipHeight = parseInt(response.data, 10);
      
      const blocks = await Promise.all(
        Array.from({ length: limit }, (_, i) => 
          blockstreamApi.get(`/block-height/${tipHeight - i}`)
            .then(res => blockstreamApi.get(`/block/${res.data}`))
        )
      );
      
      return blocks.map(block => block.data);
    }
  ];

  for (const source of sources) {
    try {
      const blocks = await source();
      return blocks.slice(0, limit).map(block => ({
        hash: block.hash || '',
        height: block.height || 0,
        time: block.time || Math.floor(Date.now() / 1000),
        size: block.size || 0,
        txCount: block.n_tx || block.tx_count || 0,
        miner: extractMinerFromCoinbase(block.miner || '')
      }));
    } catch (error) {
      console.warn('Block source failed:', error);
      continue;
    }
  }

  // If all sources fail, return mock data
  console.warn('All block sources failed, using mock data');
  return generateMockBlocks(limit);
};

// Fetch block details
export const fetchBlockDetails = async (hashOrHeight: string): Promise<BlockInfo> => {
  try {
    const isHeight = /^\d+$/.test(hashOrHeight);
    let blockHash = hashOrHeight;
    
    if (isHeight) {
      const heightResponse = await blockchainApi.get(`/block-height/${hashOrHeight}?format=json`);
      if (!heightResponse.data?.blocks?.[0]?.hash) {
        throw new Error('Block not found');
      }
      blockHash = heightResponse.data.blocks[0].hash;
    }
    
    const response = await blockchainApi.get(`/rawblock/${blockHash}?format=json`);
    if (!response.data?.hash) {
      throw new Error('Invalid block data');
    }
    
    const blockData = response.data;
    const transactions = blockData.tx?.map((tx: any) => ({
      hash: tx.hash || '',
      size: tx.size || 0,
      fee: tx.fee || 0,
      inputs: tx.inputs || [],
      out: tx.out || []
    })) || [];
    
    const blockInfo: BlockInfo = {
      hash: blockData.hash,
      height: blockData.height,
      time: blockData.time,
      size: blockData.size,
      txCount: blockData.n_tx,
      miner: extractMinerFromCoinbase(blockData.miner || ''),
      prevBlockHash: blockData.prev_block,
      nextBlockHash: null,
      merkleRoot: blockData.mrkl_root,
      version: blockData.ver,
      bits: blockData.bits,
      nonce: blockData.nonce,
      weight: blockData.weight,
      difficulty: blockData.difficulty,
      reward: calculateBlockReward(blockData.height),
      transactions
    };
    
    // Try to get next block hash
    try {
      const nextBlockResponse = await blockchainApi.get(`/block-height/${blockInfo.height + 1}?format=json`);
      if (nextBlockResponse.data?.blocks?.[0]) {
        blockInfo.nextBlockHash = nextBlockResponse.data.blocks[0].hash;
      }
    } catch {
      // Ignore error if next block not found
    }
    
    return blockInfo;
  } catch (error) {
    console.error('Error fetching block details:', error);
    return generateMockBlockDetails(hashOrHeight);
  }
};

// Fetch network statistics
export const fetchNetworkStats = async (): Promise<NetworkInfo> => {
  const fetchWithFallback = async (endpoint: string, defaultValue: any) => {
    try {
      const response = await blockchainApi.get(endpoint, { timeout: 3000 });
      return response.data;
    } catch {
      return defaultValue;
    }
  };

  try {
    const [
      stats,
      latestBlock,
      difficulty,
      hashRate,
      unconfirmedCount,
      blockCount,
      marketPrice,
      txCount24h,
      avgBlockSize,
      totalBitcoins
    ] = await Promise.all([
      fetchWithFallback('/stats?format=json', null),
      fetchWithFallback('/latestblock?format=json', null),
      fetchWithFallback('/q/getdifficulty', 78.3),
      fetchWithFallback('/q/hashrate', 350000000),
      fetchWithFallback('/q/unconfirmedcount', 12500),
      fetchWithFallback('/q/getblockcount', 800000),
      fetchWithFallback('/ticker', null),
      fetchWithFallback('/q/24hrtransactioncount', 350000),
      fetchWithFallback('/q/24hravgblocksize', 1500000),
      fetchWithFallback('/q/totalbc', 19500000)
    ]);
    
    if (!stats) {
      throw new Error('Failed to fetch basic network stats');
    }
    
    const btcPrice = marketPrice?.USD?.last || 65000;
    const difficultyValue = parseFloat(difficulty) || 78.3;
    const hashRateGH = parseFloat(hashRate) || 350000000;
    const hashRateEH = hashRateGH / 1000000;
    const unconfirmedTxs = parseInt(unconfirmedCount, 10) || 12500;
    const blockHeight = parseInt(blockCount, 10) || 800000;
    const txCount24hValue = parseInt(txCount24h, 10) || 350000;
    const avgBlockSizeValue = parseInt(avgBlockSize, 10) || 1500000;
    const totalBitcoinsValue = parseInt(totalBitcoins, 10) / 100000000 || 19500000;
    
    const nextRetargetBlock = Math.ceil(blockHeight / 2016) * 2016;
    const mempoolSize = stats.mempool_size || 250;
    const avgBlockTime = stats.minutes_between_blocks || 10;
    const avgTransactionFee = stats.total_fees_btc 
      ? (stats.total_fees_btc / stats.n_tx) || 0.0002 
      : 0.0002;
    
    const latestBlockHash = latestBlock?.hash || '';
    const marketCap = btcPrice * totalBitcoinsValue;
    const btcSent24h = stats.total_btc_sent || 250000;
    
    return {
      timestamp: Date.now(),
      hashRate: hashRateEH,
      difficulty: difficultyValue,
      unconfirmedTxs,
      blockHeight,
      latestBlockHash,
      nextRetargetBlock,
      mempoolSize,
      totalTransactions: stats.n_tx_total || 850000000,
      avgBlockTime,
      avgTransactionFee,
      marketCap,
      txCount24h: txCount24hValue,
      btcSent24h
    };
  } catch (error) {
    console.error('Error fetching network stats:', error);
    return generateMockNetworkStats();
  }
};

// Generate mock data for testing
const generateMockBlocks = (count: number): BlockData[] => {
  const mockBlocks: BlockData[] = [];
  const miners = [
    'Foundry USA',
    'AntPool',
    'F2Pool',
    'Binance Pool',
    'ViaBTC',
    'SlushPool'
  ];
  
  for (let i = 0; i < count; i++) {
    const height = 800000 - i;
    const time = Math.floor(Date.now() / 1000) - (i * 600);
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

// Generate mock block details
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
    reward: calculateBlockReward(height),
    transactions: []
  };
};

// Generate mock network stats
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

// Export all functions
export default {
  fetchLatestBlocks,
  fetchBlockDetails,
  fetchNetworkStats,
  fetchMempoolInfo: async () => ({
    size: 250 * 1024 * 1024,
    bytes: 250 * 1024 * 1024,
    count: 12500,
    fee_levels: [
      { fee: 0.00015, size: 50 * 1024 * 1024 },
      { fee: 0.0001, size: 75 * 1024 * 1024 },
      { fee: 0.00005, size: 75 * 1024 * 1024 },
      { fee: 0.00001, size: 50 * 1024 * 1024 }
    ]
  }),
  generateNetworkChartData: (dataPoints: number = 20) => ({
    hashRate: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 350 + Math.random() * 10
    })),
    difficulty: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 78 + Math.random() * 1
    })),
    mempool: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 240 + Math.random() * 20
    })),
    fees: Array.from({ length: dataPoints }, (_, i) => ({
      timestamp: Date.now() - (dataPoints - 1 - i) * 60000,
      value: 0.0002 + Math.random() * 0.0001
    }))
  })
};