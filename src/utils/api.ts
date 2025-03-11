import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { AddressResponse, TransactionResponse, BitcoinPrice, LiveTransaction, NetworkInfo, BlockData, BlockInfo, BlockchainTickerResponse } from '../types';
import blockApi from './blockApi';
import { formatNumber } from './format';

// Base URL should be absolute when running in Docker
const API_BASE_URL = '/api/v2';
const BLOCKCHAIN_API_URL = '/block_api';

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
  timeout: 5000,
  validateStatus: (status) => status >= 200 && status < 500
});

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
bitcoinApi.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers['User-Agent'] = getRandomUserAgent();
  }
  return config;
});

blockchainApi.interceptors.request.use((config) => {
  if (config.headers) {
    config.headers['User-Agent'] = getRandomUserAgent();
  }
  return config;
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && error instanceof AxiosError && (error.response?.status ?? 500) >= 500) {
      console.warn(`Request failed, retrying... (${retries} attempts left)`);
      await sleep(RETRY_DELAY);
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const fetchBitcoinPrice = async (): Promise<BitcoinPrice> => {
  try {
    // Try multiple price sources in sequence
    const sources = [
      // Primary source: blockchain.info ticker
      async () => {
        const response = await blockchainApi.get<BlockchainTickerResponse>('/ticker', {
          timeout: 5000,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.data?.USD?.last) {
          throw new Error('Invalid price data from blockchain.info');
        }
        
        const usdData = response.data.USD;
        const last = Number(usdData.last);
        const open = Number(usdData['15m'] || usdData.last);
        
        if (isNaN(last) || isNaN(open)) {
          throw new Error('Invalid numeric values in price data');
        }
        
        return {
          USD: {
            last,
            symbol: '$',
            change_24h: ((last - open) / open) * 100
          }
        };
      },
      
      // Fallback source: coingecko API
      async () => {
        interface CoinGeckoResponse {
          bitcoin?: {
            usd?: number;
            usd_24h_change?: number;
          };
        }
        
        const response = await axios.get<CoinGeckoResponse>('https://api.coingecko.com/api/v3/simple/price', {
          params: {
            ids: 'bitcoin',
            vs_currencies: 'usd',
            include_24hr_change: true
          },
          timeout: 5000
        });
        
        if (!response.data?.bitcoin?.usd) {
          throw new Error('Invalid price data from coingecko');
        }
        
        return {
          USD: {
            last: response.data.bitcoin.usd,
            symbol: '$',
            change_24h: response.data.bitcoin.usd_24h_change || 0
          }
        };
      }
    ];
    
    // Try each source in sequence
    for (const source of sources) {
      try {
        return await retryRequest(source);
      } catch (error) {
        console.warn('Price source failed:', error);
        continue;
      }
    }
    
    // If all sources fail, return a fallback with default values
    console.warn('All price sources failed, using fallback values');
    return {
      USD: {
        last: 65000,
        symbol: '$',
        change_24h: 0
      }
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    
    // Return a safe fallback with default values
    return {
      USD: {
        last: 65000,
        symbol: '$',
        change_24h: 0
      }
    };
  }
};

// Export other API functions
export const fetchAddressInfo = blockApi.fetchAddressInfo;
export const fetchTransactionInfo = blockApi.fetchTransactionInfo;
export const fetchLatestBlocks = blockApi.fetchLatestBlocks;
export const fetchBlockDetails = blockApi.fetchBlockDetails;
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
