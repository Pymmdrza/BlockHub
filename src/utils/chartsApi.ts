import axios from 'axios';
import { ChartResponse, ChartInfo, ChartCategory, MiningPoolDistribution, MarketDominanceData } from '../types';

// Base URL for blockchain.info charts API
const CHARTS_API_URL = '/block_api/charts';

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
const chartsApi = axios.create({
  baseURL: CHARTS_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 5000,
  validateStatus: (status) => status >= 200 && status < 500
});

// Add request interceptor to rotate User-Agent
chartsApi.interceptors.request.use((config) => {
  config.headers['User-Agent'] = getRandomUserAgent();
  return config;
});

/**
 * Fetch chart data from blockchain.info API
 * @param chartName Name of the chart to fetch
 * @param timespan Timespan for the chart data (e.g., '1year', '5years')
 * @param rollingAverage Rolling average period (e.g., '8hours', '1day')
 * @returns Promise with chart data
 */
export const fetchChartData = async (
  chartName: string,
  timespan: string = '1year',
  rollingAverage: string = '8hours'
): Promise<ChartResponse> => {
  try {
    const response = await chartsApi.get(`/${chartName}`, {
      params: {
        timespan,
        rollingAverage,
        format: 'json'
      },
      timeout: 5000
    });
    
    if (!response.data || !response.data.values) {
      console.warn(`Invalid chart data received for ${chartName}, falling back to mock data`);
      return generateMockChartData(chartName, timespan);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching chart data for ${chartName}:`, error);
    
    // Return mock data if API fails
    return generateMockChartData(chartName, timespan);
  }
};

/**
 * Get available charts information
 * @returns Array of chart info objects
 */
export const getAvailableCharts = (): ChartInfo[] => {
  return [
    // Market charts
    {
      id: 'market-price',
      name: 'Market Price (USD)',
      description: 'Average USD market price across major bitcoin exchanges.',
      unit: 'USD',
      category: 'market',
      color: '#F59E0B'
    },
    {
      id: 'trade-volume',
      name: 'Trade Volume (USD)',
      description: 'The total USD value of trading volume on major bitcoin exchanges.',
      unit: 'USD',
      category: 'market',
      color: '#10B981'
    },
    {
      id: 'market-cap',
      name: 'Market Capitalization',
      description: 'The total USD value of bitcoin supply in circulation.',
      unit: 'USD',
      category: 'market',
      color: '#3B82F6'
    },
    
    // Blockchain charts
    {
      id: 'n-transactions',
      name: 'Transactions per Day',
      description: 'The number of daily confirmed Bitcoin transactions.',
      unit: 'Transactions',
      category: 'blockchain',
      color: '#8B5CF6'
    },
    {
      id: 'n-transactions-per-block',
      name: 'Transactions per Block',
      description: 'The average number of transactions per block.',
      unit: 'Transactions',
      category: 'blockchain',
      color: '#EC4899'
    },
    {
      id: 'median-confirmation-time',
      name: 'Median Confirmation Time',
      description: 'The median time for a transaction to be accepted into a mined block.',
      unit: 'Minutes',
      category: 'blockchain',
      color: '#EF4444'
    },
    {
      id: 'utxo-count',
      name: 'Unspent Transaction Outputs',
      description: 'The total number of unspent Bitcoin transaction outputs.',
      unit: 'Count',
      category: 'blockchain',
      color: '#F97316'
    },
    
    // Mining charts
    {
      id: 'hash-rate',
      name: 'Hash Rate',
      description: 'The estimated number of terahashes per second the Bitcoin network is performing.',
      unit: 'TH/s',
      category: 'mining',
      color: '#06B6D4'
    },
    {
      id: 'difficulty',
      name: 'Difficulty',
      description: 'A relative measure of how difficult it is to mine a new block.',
      unit: '',
      category: 'mining',
      color: '#6366F1'
    },
    {
      id: 'miners-revenue',
      name: 'Miners Revenue',
      description: 'Total value of coinbase block rewards and transaction fees paid to miners.',
      unit: 'USD',
      category: 'mining',
      color: '#D97706'
    },
    {
      id: 'transaction-fees',
      name: 'Transaction Fees',
      description: 'The total value of all transaction fees paid to miners.',
      unit: 'BTC',
      category: 'mining',
      color: '#DC2626'
    },
    {
      id: 'cost-per-transaction-percent',
      name: 'Cost % of Transaction Volume',
      description: 'Miners revenue as percentage of the transaction volume.',
      unit: '%',
      category: 'mining',
      color: '#7C3AED'
    },
    
    // Network charts
    {
      id: 'mempool-size',
      name: 'Mempool Size',
      description: 'The aggregate size of transactions waiting to be confirmed.',
      unit: 'Bytes',
      category: 'network',
      color: '#2563EB'
    },
    {
      id: 'mempool-count',
      name: 'Mempool Transaction Count',
      description: 'The number of unconfirmed transactions in the mempool.',
      unit: 'Count',
      category: 'network',
      color: '#059669'
    },
    {
      id: 'mempool-growth',
      name: 'Mempool Growth',
      description: 'The rate at which the mempool is growing per second.',
      unit: 'Bytes/s',
      category: 'network',
      color: '#DB2777'
    },
    {
      id: 'unspent-transactions',
      name: 'Unspent Transactions',
      description: 'The number of unspent transactions outputs (UTXO set size).',
      unit: 'Count',
      category: 'network',
      color: '#9333EA'
    }
  ];
};

/**
 * Get charts by category
 * @param category Category to filter by
 * @returns Array of chart info objects for the specified category
 */
export const getChartsByCategory = (category: ChartCategory): ChartInfo[] => {
  return getAvailableCharts().filter(chart => chart.category === category);
};

/**
 * Get mining pool distribution data
 * @returns Array of mining pool distribution data
 */
export const getMiningPoolDistribution = async (): Promise<MiningPoolDistribution[]> => {
  try {
    const response = await axios.get('/block_api/pools?timespan=4days', {
      timeout: 5000
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      console.warn('Invalid mining pool data received, falling back to mock data');
      return generateMockMiningPoolDistribution();
    }
    
    // Process and return the mining pool distribution data
    return response.data.map((pool: any) => ({
      name: pool.name,
      share: pool.percentage,
      color: getRandomColor(pool.name)
    }));
  } catch (error) {
    console.error('Error fetching mining pool distribution:', error);
    
    // Return mock data if API fails
    return generateMockMiningPoolDistribution();
  }
};

/**
 * Get market dominance data
 * @returns Array of market dominance data
 */
export const getMarketDominance = async (): Promise<MarketDominanceData[]> => {
  // This is mock data as blockchain.info doesn't provide this directly
  return [
    { name: 'Bitcoin', value: 52.3, color: '#F7931A' },
    { name: 'Ethereum', value: 18.7, color: '#627EEA' },
    { name: 'BNB', value: 3.2, color: '#F3BA2F' },
    { name: 'Solana', value: 2.8, color: '#00FFA3' },
    { name: 'XRP', value: 2.1, color: '#23292F' },
    { name: 'Others', value: 20.9, color: '#8884D8' }
  ];
};

// Helper functions

/**
 * Generate a random color based on a string
 * @param str String to generate color from
 * @returns Hex color code
 */
const getRandomColor = (str: string): string => {
  // Generate a hash from the string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert hash to RGB
  const r = (hash & 0xFF0000) >> 16;
  const g = (hash & 0x00FF00) >> 8;
  const b = hash & 0x0000FF;
  
  // Ensure colors are vibrant enough
  const minBrightness = 50; // Minimum brightness value
  const r2 = Math.max(r, minBrightness);
  const g2 = Math.max(g, minBrightness);
  const b2 = Math.max(b, minBrightness);
  
  return `#${r2.toString(16).padStart(2, '0')}${g2.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
};

// Mock data generators

/**
 * Generate mock chart data
 * @param chartName Name of the chart
 * @param timespan Timespan for the chart data
 * @returns Mock chart data
 */
const generateMockChartData = (chartName: string, timespan: string): ChartResponse => {
  const now = Date.now();
  const days = timespan.includes('year') 
    ? timespan.includes('5') ? 1825 : 365 
    : timespan.includes('month') 
      ? timespan.includes('6') ? 180 : 30 
      : timespan.includes('week') ? 7 : 1;
  
  const interval = (days * 24 * 60 * 60 * 1000) / 100; // 100 data points
  const startTime = now - (days * 24 * 60 * 60 * 1000);
  
  // Generate values based on chart name
  const values = Array.from({ length: 100 }, (_, i) => {
    const timestamp = Math.floor((startTime + (i * interval)) / 1000);
    let value = 0;
    
    switch (chartName) {
      case 'market-price':
        // Simulate Bitcoin price between $30,000 and $70,000
        value = 30000 + (Math.sin(i / 10) + 1) * 20000 + Math.random() * 5000;
        break;
      case 'hash-rate':
        // Simulate hash rate between 300 and 400 EH/s
        value = 300 + (Math.sin(i / 15) + 1) * 50 + Math.random() * 10;
        break;
      case 'difficulty':
        // Simulate difficulty between 70T and 90T
        value = 70 + (Math.sin(i / 20) + 1) * 10 + Math.random() * 2;
        break;
      case 'n-transactions':
        // Simulate daily transactions between 300,000 and 500,000
        value = 300000 + (Math.sin(i / 8) + 1) * 100000 + Math.random() * 20000;
        break;
      case 'mempool-size':
        // Simulate mempool size between 100MB and 300MB
        value = 100 + (Math.sin(i / 5) + 1) * 100 + Math.random() * 30;
        break;
      case 'market-cap':
        // Simulate market cap between $600B and $1.4T
        value = 600000000000 + (Math.sin(i / 12) + 1) * 400000000000 + Math.random() * 50000000000;
        break;
      case 'trade-volume':
        // Simulate trade volume between $20B and $60B
        value = 20000000000 + (Math.sin(i / 7) + 1) * 20000000000 + Math.random() * 5000000000;
        break;
      default:
        // Generic random value between 0 and 100
        value = (Math.sin(i / 10) + 1) * 50 + Math.random() * 10;
    }
    
    return { x: timestamp, y: value };
  });
  
  // Get chart info
  const chartInfo = getAvailableCharts().find(chart => chart.id === chartName) || {
    id: chartName,
    name: chartName,
    description: 'Chart data',
    unit: '',
    category: 'blockchain' as ChartCategory,
    color: '#3B82F6'
  };
  
  return {
    status: 'ok',
    name: chartInfo.name,
    unit: chartInfo.unit,
    period: 'day',
    description: chartInfo.description,
    values
  };
};

/**
 * Generate mock mining pool distribution data
 * @returns Mock mining pool distribution data
 */
const generateMockMiningPoolDistribution = (): MiningPoolDistribution[] => {
  return [
    { name: 'Foundry USA', share: 32.5, color: '#F97316' },
    { name: 'AntPool', share: 18.7, color: '#10B981' },
    { name: 'F2Pool', share: 14.2, color: '#3B82F6' },
    { name: 'Binance Pool', share: 11.8, color: '#F59E0B' },
    { name: 'ViaBTC', share: 8.3, color: '#8B5CF6' },
    { name: 'SlushPool', share: 7.5, color: '#EC4899' },
    { name: 'Poolin', share: 4.2, color: '#EF4444' },
    { name: 'Unknown', share: 2.8, color: '#6B7280' }
  ];
};

export default {
  fetchChartData,
  getAvailableCharts,
  getChartsByCategory,
  getMiningPoolDistribution,
  getMarketDominance
};