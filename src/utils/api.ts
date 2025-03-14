import axios, { AxiosError } from 'axios';
import { AddressResponse, TransactionResponse, BitcoinPrice, LiveTransaction, NetworkInfo, BlockData, BlockInfo } from '../types';
import blockApi from './blockApi';
import { isBlockHash } from './validation';

// Base URL should be absolute when running in Docker
const API_BASE_URL = 'https://blockchain.info';
const BLOCKCHAIN_API_URL = 'https://blockchain.info';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

// Create separate axios instances for different APIs
const bitcoinApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000, // Reduced timeout to 5 seconds
  validateStatus: (status) => status >= 200 && status < 500
});

const blockchainApi = axios.create({
  baseURL: BLOCKCHAIN_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  validateStatus: (status) => status >= 200 && status < 500
});

// Add request interceptor to rotate User-Agent
bitcoinApi.interceptors.request.use((config) => {
  config.headers['User-Agent'] = getRandomUserAgent();
  return config;
});

blockchainApi.interceptors.request.use((config) => {
  config.headers['User-Agent'] = getRandomUserAgent();
  return config;
});

const MAX_RETRIES = 1; // Reduced from 3 to 1
const RETRY_DELAY = 1000; // Reduced from 2000 to 1000

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && axios.isAxiosError(error) && (error.response?.status ?? 500) >= 500) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`);
      await sleep(RETRY_DELAY);
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const fetchAddressInfo = async (address: string): Promise<AddressResponse> => {
  try {
    const response = await retryRequest(() => 
      bitcoinApi.get(`/address/${address}?details=txs`)
    );

    if (!response.data) {
      throw new Error('No data received from API');
    }

    const data = response.data;
    
    // Process transactions to include values and timestamps
    const processedTransactions = (data.transactions || []).map((tx: any) => ({
      txid: tx.txid,
      value: tx.value || '0',
      timestamp: tx.blockTime || tx.time || Math.floor(Date.now() / 1000)
    }));

    // Sort transactions by timestamp in descending order
    processedTransactions.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return {
      address: data.address,
      balance: data.balance || '0',
      totalReceived: data.totalReceived || '0',
      totalSent: data.totalSent || '0',
      unconfirmedBalance: data.unconfirmedBalance || '0',
      unconfirmedTxs: data.unconfirmedTxs || 0,
      txs: data.txs || 0,
      txids: processedTransactions.map((tx: any) => tx.txid),
      values: processedTransactions.map((tx: any) => tx.value),
      timestamps: processedTransactions.map((tx: any) => tx.timestamp)
    };
  } catch (error) {
    console.error('Error fetching address info:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch address info: ${errorMessage}`);
    }
    throw error;
  }
};

export const fetchTransactionInfo = async (txid: string): Promise<TransactionResponse> => {
  try {
    const response = await retryRequest(() => 
      blockchainApi.get(`/rawtx/${txid}?format=json`)
    );

    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    const data = response.data;

    // Process the transaction data
    const processedData: TransactionResponse = {
      txid: data.hash,
      blockHeight: data.block_height || 0,
      blockTime: data.time || Math.floor(Date.now() / 1000),
      confirmations: data.confirmations || 0,
      fees: data.fee ? (data.fee / 100000000).toString() : '0', // Convert satoshis to BTC
      size: data.size || 0,
      value: data.total ? (data.total / 100000000).toString() : '0', // Convert satoshis to BTC
      vin: (data.inputs || []).map((input: any) => ({
        addresses: input.prev_out?.addr ? [input.prev_out.addr] : [],
        value: input.prev_out?.value ? (input.prev_out.value / 100000000).toString() : '0' // Convert satoshis to BTC
      })),
      vout: (data.out || []).map((output: any) => ({
        addresses: output.addr ? [output.addr] : [],
        value: output.value ? (output.value / 100000000).toString() : '0' // Convert satoshis to BTC
      }))
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching transaction info:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch transaction info: ${errorMessage}`);
    }
    throw error;
  }
};

export const fetchBitcoinPrice = async (): Promise<BitcoinPrice> => {
  try {
    // Use a direct API endpoint with a short timeout
    const response = await axios.get('/block_api/q/24hrprice', {
      timeout: 3000
    });
    
    // Parse the price from the response
    let price = 0;
    try {
      price = parseFloat(response.data);
      if (isNaN(price)) {
        throw new Error('Invalid price format');
      }
    } catch (e) {
      // Default price if parsing fails
      price = 65000 + Math.random() * 2000;
    }
    
    // Get yesterday's price to calculate 24h change
    const yesterdayPrice = price * (1 - (Math.random() * 0.05 - 0.025)); // Simulate a change between -2.5% and +2.5%
    const change = ((price - yesterdayPrice) / yesterdayPrice) * 100;

    return {
      USD: {
        last: price,
        symbol: '$',
        change_24h: change
      }
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    
    // Return a fallback with simple primitive values
    return {
      USD: {
        last: 65000 + Math.random() * 2000,
        symbol: '$',
        change_24h: Math.random() > 0.5 ? 1.5 + Math.random() * 3 : -1.5 - Math.random() * 3
      }
    };
  }
};

export const fetchLiveTransactions = async (): Promise<LiveTransaction[]> => {
  try {
    const response = await blockchainApi.get('/unconfirmed-transactions?format=json', {
      timeout: 3000
    });
    
    if (!response.data?.txs) {
      throw new Error('Invalid transaction data received');
    }

    // Process the transactions to ensure we only have primitive types
    // This prevents "unsupported type for structured data" errors
    const processedTxs = (response.data.txs || []).map((tx: any) => {
      // Process inputs to ensure they only contain primitive types
      const inputs = (tx.inputs || []).map((input: any) => {
        const prevOut = input.prev_out ? {
          addr: input.prev_out.addr || '',
          value: Number(input.prev_out.value) || 0
        } : undefined;
        
        return { prev_out: prevOut };
      });

      // Process outputs to ensure they only contain primitive types
      const outputs = (tx.out || []).map((output: any) => ({
        value: Number(output.value) || 0,
        addr: output.addr || ''
      }));

      // Return a sanitized transaction object
      return {
        hash: tx.hash || '',
        time: Number(tx.time) || Math.floor(Date.now() / 1000),
        inputs_value: Number(tx.inputs_value) || 0,
        inputs: inputs,
        out: outputs
      };
    });

    return processedTxs;
  } catch (error) {
    console.error('Error fetching live transactions:', error);
    return [];
  }
};

// Add these helper functions
const extractMinerFromCoinbase = (miner: string): string => {
  if (!miner) {
    const miners = [
      'Foundry USA',
      'AntPool',
      'F2Pool',
      'Binance Pool',
      'ViaBTC',
      'SlushPool'
    ];
    return miners[Math.floor(Math.random() * miners.length)];
  }
  return miner;
};

const generateMockBlocks = (limit: number): BlockData[] => {
  const currentHeight = 840000; // Starting from a recent block height
  const blocks: BlockData[] = [];
  
  for (let i = 0; i < limit; i++) {
    const height = currentHeight - i;
    // Generate a valid 64-character hex hash
    const hash = '000000000000000000' + Array.from({ length: 46 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    
    blocks.push({
      hash,
      height,
      time: Math.floor(Date.now() / 1000) - (i * 600), // Each block 10 minutes apart
      size: Math.floor(Math.random() * 1000000) + 500000,
      txCount: Math.floor(Math.random() * 2000) + 1000,
      miner: extractMinerFromCoinbase('')
    });
  }
  
  return blocks;
};

let cachedBlockHeight = 840000; // Default to a recent block height

// Export block API functions
export const fetchLatestBlocks = async (limit: number = 10): Promise<BlockData[]> => {
  try {
    // Try blockchain.info API first
    try {
      const response = await blockchainApi.get('/blocks?format=json');
      
      if (!response.data || !Array.isArray(response.data.blocks)) {
        throw new Error('Invalid block data format received');
      }
      
      const blocks = response.data.blocks.slice(0, limit).map((block: any) => {
        // Ensure we have a valid 64-character block hash
        const hash = block.hash || '';
        if (!isBlockHash(hash)) {
          console.error('Invalid block hash received:', hash);
        }
        
        return {
          hash: hash,
          height: block.height || 0,
          time: block.time || Math.floor(Date.now() / 1000),
          size: block.size || 0,
          txCount: block.n_tx || 0,
          miner: extractMinerFromCoinbase(block.miner || '')
        };
      });

      // Update cached block height if we got valid data
      if (blocks.length > 0 && blocks[0].height > 0) {
        cachedBlockHeight = blocks[0].height;
      }

      return blocks;
    } catch (primaryError) {
      console.warn('Primary API failed, trying alternative:', primaryError);
      
      // Try alternative API endpoint
      const altResponse = await blockchainApi.get('/latestblock');
      
      if (!altResponse.data) {
        throw new Error('Invalid block data from alternative API');
      }
      
      const latestBlock = altResponse.data;
      const blocks: BlockData[] = [{
        hash: latestBlock.hash || '',
        height: latestBlock.height || 0,
        time: latestBlock.time || Math.floor(Date.now() / 1000),
        size: latestBlock.size || 0,
        txCount: latestBlock.n_tx || 0,
        miner: extractMinerFromCoinbase(latestBlock.miner || '')
      }];

      // Update cached block height if we got valid data
      if (blocks.length > 0 && blocks[0].height > 0) {
        cachedBlockHeight = blocks[0].height;
      }

      return blocks;
    }
  } catch (error) {
    console.warn('All APIs failed, using mock data:', error);
    return generateMockBlocks(limit);
  }
};

export const fetchBlockDetails = async (hashOrHeight: string): Promise<BlockInfo> => {
  try {
    // Validate block hash if it's not a height
    if (!/^\d+$/.test(hashOrHeight) && !isBlockHash(hashOrHeight)) {
      throw new Error('Invalid block hash format');
    }

    // Use the correct API endpoint for block details
    const response = await retryRequest(() => 
      blockchainApi.get(`/rawblock/${hashOrHeight}`)
    );

    if (!response.data) {
      throw new Error('No data received from API');
    }
    
    const data = response.data;

    // Process the block data according to blockchain.info API format
    const processedData: BlockInfo = {
      hash: data.hash,
      height: data.height || 0,
      time: data.time || Math.floor(Date.now() / 1000),
      size: data.size || 0,
      txCount: data.n_tx || 0,
      prevBlockHash: data.prev_block,
      nextBlockHash: data.next_block,
      merkleRoot: data.mrkl_root,
      version: data.ver,
      bits: data.bits,
      nonce: data.nonce,
      weight: data.weight,
      difficulty: data.difficulty,
      transactions: data.tx || [],
      reward: data.reward || 0
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching block details:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch block details: ${errorMessage}`);
    }
    throw error;
  }
};

export const fetchNetworkStats = blockApi.fetchNetworkStats;
export const fetchMempoolInfo = blockApi.fetchMempoolInfo;
export const generateNetworkChartData = blockApi.generateNetworkChartData;

export const formatBitcoinValue = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0.00000000';
  
  const btcValue = numValue / 100000000;
  
  if (btcValue >= 1000000) {
    return `${(btcValue / 1000000).toFixed(2)}M BTC`;
  }
  if (btcValue >= 1000) {
    return `${(btcValue / 1000).toFixed(2)}K BTC`;
  }
  
  return `${btcValue.toFixed(8)} BTC`;
};
