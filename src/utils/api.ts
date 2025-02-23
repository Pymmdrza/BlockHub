import axios from 'axios';
import { AddressResponse, TransactionResponse, BitcoinPrice, LiveTransaction } from '../types';

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
];

const getRandomUserAgent = () => {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const axiosInstance = axios.create({
  baseURL: '/blockchain-api',
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

const validateAddressResponse = (data: any): void => {
  if (!data) throw new Error('Empty response from API');
  if (typeof data !== 'object') throw new Error('Invalid response format from API');
  if (!Array.isArray(data.txs)) throw new Error('Transaction data is missing or invalid');
  if (typeof data.final_balance !== 'number') throw new Error('Balance data is missing or invalid');
  if (typeof data.total_received !== 'number') throw new Error('Total received data is missing or invalid');
  if (typeof data.total_sent !== 'number') throw new Error('Total sent data is missing or invalid');
};

const validateTransactionResponse = (data: any): void => {
  if (!data) throw new Error('Empty response from API');
  if (typeof data !== 'object') throw new Error('Invalid response format from API');
  if (!Array.isArray(data.out)) throw new Error('Output data is missing or invalid');
  if (!Array.isArray(data.inputs)) throw new Error('Input data is missing or invalid');
};

export const fetchAddressInfo = async (address: string): Promise<AddressResponse> => {
  try {
    const response = await retryRequest(() => 
      axiosInstance.get(`/rawaddr/${address}?format=json`, {
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      })
    );

    const data = response.data;
    validateAddressResponse(data);
    
    // Process transactions to include values and timestamps
    const processedTransactions = data.txs.map((tx: any) => {
      // Calculate total value for this transaction
      const totalValue = tx.out.reduce((sum: number, output: any) => {
        return sum + (output.value || 0);
      }, 0);

      return {
        txid: tx.hash,
        value: totalValue, // Use the calculated totalValue
        timestamp: tx.time || Math.floor(Date.now() / 1000)
      };
    });

    // Sort transactions by timestamp in descending order
    processedTransactions.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return {
      address: data.address || address,
      balance: (data.final_balance / 100000000).toString(),
      totalReceived: (data.total_received / 100000000).toString(),
      totalSent: (data.total_sent / 100000000).toString(),
      unconfirmedBalance: ((data.unconfirmed_balance || 0) / 100000000).toString(),
      unconfirmedTxs: data.n_unredeemed || 0,
      txs: data.n_tx || 0,
      txids: processedTransactions.map(tx => tx.txid),
      values: processedTransactions.map(tx => (tx.value / 100000000).toString()),
      timestamps: processedTransactions.map(tx => tx.timestamp)
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
      axiosInstance.get(`/rawtx/${txid}?format=json`, {
        headers: {
          'User-Agent': getRandomUserAgent()
        }
      })
    );
    
    const data = response.data;
    validateTransactionResponse(data);

    // Calculate total value from outputs
    const totalValue = data.out.reduce((sum: number, output: any) => {
      return sum + (output.value || 0);
    }, 0);

    return {
      txid: data.hash || txid,
      blockHeight: data.block_height || 0,
      blockTime: data.time || Math.floor(Date.now() / 1000),
      confirmations: data.confirmations || 0,
      fees: ((data.fee || 0) / 100000000).toString(),
      size: data.size || 0,
      value: (totalValue / 100000000).toString(),
      vin: data.inputs.map((input: any) => ({
        addresses: input.prev_out?.addr ? [input.prev_out.addr] : [],
        value: input.prev_out ? ((input.prev_out.value || 0) / 100000000).toString() : '0'
      })),
      vout: data.out.map((output: any) => ({
        addresses: output.addr ? [output.addr] : [],
        value: ((output.value || 0) / 100000000).toString()
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
