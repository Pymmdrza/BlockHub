// src/api.ts
import axios from 'axios';

const API_BASE_URL = '/api';

const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:106.0) Gecko/20100101 Firefox/106.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/237.84.2.178 Safari/537.36",
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

    if (!data) {
      throw new Error("No data received from the API.");
    }

    // Process transactions to include values and timestamps
    const processedTransactions = data.transactions?.map((tx: any) => {
        let totalOutputValue = 0;
        if (tx.vout) {
          totalOutputValue = tx.vout.reduce((sum: number, output: any) => {
            return sum + (Number(output.value) || 0); // Ensure value is a number
          }, 0);
        }

      return {
        txid: tx.txid,
        value: totalOutputValue.toString(), // Use calculated total
        timestamp: tx.blockTime || tx.time || Math.floor(Date.now() / 1000)
      };
    }) || [];

    // Sort transactions by timestamp in descending order
    processedTransactions.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0));

    return {
      page: data.page || 1,
      totalPages: data.totalPages || 1,
      itemsOnPage: data.itemsOnPage || 1000,
      address: data.address || address,
      balance: (data.balance || "0").toString(),
      totalReceived: (data.totalReceived || "0").toString(),
      totalSent: (data.totalSent || "0").toString(),
      unconfirmedBalance: (data.unconfirmedBalance || "0").toString(),
      unconfirmedTxs: data.unconfirmedTxs || 0,
      txs: data.txs || 0,
      txids: processedTransactions.map((tx: any) => tx.txid),
      values: processedTransactions.map((tx: any) => tx.value),
      timestamps: processedTransactions.map((tx: any) => tx.timestamp),
      transactions: processedTransactions // Include the processed transactions
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
    // This function is not needed based on the provided API structure
    return null as any;
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