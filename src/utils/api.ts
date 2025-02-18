import axios from 'axios';
import { AddressResponse, TransactionResponse, BitcoinPrice, LiveTransaction } from '../types';

// Base URL will be relative to the current domain
const API_BASE_URL = '/api/v2';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'User-Agent': getRandomUserAgent()
  },
  withCredentials: false,
  timeout: 30000,
  method: 'GET'
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryRequest = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await sleep(RETRY_DELAY);
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const fetchAddressInfo = async (address: string): Promise<AddressResponse> => {
  try {
    const response = await retryRequest(() => 
      axiosInstance.get(`/address/${address}?details=txs`, {
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      })
    );

    const data = response.data;
    
    // Process transactions to include values and timestamps
    const processedTransactions = data.transactions.map((tx: any) => ({
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
      axiosInstance.get(`/tx/${txid}`, {
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      })
    );
    
    const data = response.data;

    return {
      txid: data.txid,
      blockHeight: data.blockHeight || 0,
      blockTime: data.blockTime || Math.floor(Date.now() / 1000),
      confirmations: data.confirmations || 0,
      fees: data.fees || '0',
      size: data.size || 0,
      value: data.value || '0',
      vin: (data.vin || []).map((input: any) => ({
        addresses: input.addresses || [],
        value: input.value || '0'
      })),
      vout: (data.vout || []).map((output: any) => ({
        addresses: output.addresses || [],
        value: output.value || '0'
      }))
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(`Failed to fetch transaction info: ${errorMessage}`);
    }
    throw error;
  }
};

export const fetchBitcoinPrice = async (): Promise<BitcoinPrice> => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        include_24hr_change: true
      }
    });
    
    return {
      USD: {
        last: response.data.bitcoin.usd || 0,
        symbol: '$',
        change_24h: response.data.bitcoin.usd_24h_change || 0
      }
    };
  } catch (error) {
    return {
      USD: {
        last: 0,
        symbol: '$',
        change_24h: 0
      }
    };
  }
};

export const fetchLiveTransactions = async (): Promise<LiveTransaction[]> => {
  try {
    const response = await axios.get('/blockchain-api/unconfirmed-transactions?format=json');
    return response.data.txs || [];
  } catch (error) {
    console.error('Error fetching live transactions:', error);
    return [];
  }
};

export const formatBitcoinValue = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return (numValue / 100000000).toFixed(8);
};
