import axios from 'axios';
import { AddressResponse, TransactionResponse, BitcoinPrice, LiveTransaction } from '../types';

const API_BASE_URL = 'https://btcbook.guarda.co/api/v2';

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
    'Referer': 'https://btcbook.guarda.co',
    'Origin': 'https://btcbook.guarda.co',
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

export const fetchAddressInfo = async (address: string, page = 1): Promise<AddressResponse> => {
  try {
    const response = await retryRequest(() => 
      axiosInstance.get(`/address/${address}`, {
        params: { page },
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      })
    );
    return response.data;
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
    return response.data;
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
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    
    return {
      USD: {
        last: response.data.bitcoin.usd,
        symbol: '$',
        change_24h: response.data.bitcoin.usd_24h_change
      }
    };
  } catch (error) {
    console.error('Error fetching Bitcoin price:', error);
    throw error;
  }
};

export const fetchLiveTransactions = async (): Promise<LiveTransaction[]> => {
  try {
    const response = await axios.get('https://blockchain.info/unconfirmed-transactions?format=json');
    return response.data.txs;
  } catch (error) {
    console.error('Error fetching live transactions:', error);
    throw error;
  }
};

export const formatBitcoinValue = (value: string): string => {
  return (Number(value) / 100000000).toFixed(8);
};