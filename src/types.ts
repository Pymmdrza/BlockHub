// Bitcoin price types
export interface BitcoinPrice {
  USD: {
    last: number;
    symbol: string;
    change_24h: number;
  };
}

// Address types
export interface AddressResponse {
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  txids: string[];
  values: string[];
  timestamps: number[];
}

// Transaction types
export interface TransactionResponse {
  txid: string;
  blockHeight: number;
  blockTime: number;
  confirmations: number;
  fees: string;
  size: number;
  value: string;
  vin: Array<{
    addresses: string[];
    value: string;
  }>;
  vout: Array<{
    addresses: string[];
    value: string;
  }>;
}

// Live transaction types
export interface LiveTransaction {
  hash: string;
  time: number;
  inputs_value: number;
  inputs?: Array<{
    prev_out?: {
      addr?: string;
      value: number;
    };
  }>;
  out: Array<{
    value: number;
    addr?: string;
  }>;
}

// Block types
export interface BlockInfo {
  hash: string;
  height: number;
  time: number;
  size: number;
  txCount: number;
  miner?: string;
  prevBlockHash?: string;
  nextBlockHash?: string | null;
  merkleRoot?: string;
  version?: number;
  bits?: string;
  nonce?: number;
  weight?: number;
  difficulty?: number;
  reward?: number;
  transactions?: any[];
}

export interface BlockData {
  hash: string;
  height: number;
  time: number;
  size: number;
  txCount: number;
  miner?: string;
}

// WebSocket types
export interface WebSocketBlock {
  hash: string;
  height: number;
  time: number;
  txIndexes: number[];
  size: number;
  prevBlockIndex: number;
  mrklRoot: string;
  nTx: number;
  blockIndex: number;
}

export interface WebSocketTransaction {
  hash: string;
  ver: number;
  vin_sz: number;
  vout_sz: number;
  lock_time: number;
  size: number;
  relayed_by: string;
  tx_index: number;
  time: number;
  inputs: Array<{
    prev_out?: {
      addr?: string;
      n: number;
      script: string;
      spent: boolean;
      tx_index: number;
      type: number;
      value: number;
    };
    script: string;
    sequence: number;
  }>;
  out: Array<{
    addr?: string;
    n: number;
    script: string;
    spent: boolean;
    tx_index: number;
    type: number;
    value: number;
  }>;
}

// Network stats types
export interface NetworkInfo {
  timestamp: number;
  hashRate: number;
  difficulty: number;
  unconfirmedTxs: number;
  blockHeight: number;
  latestBlockHash?: string;
  nextRetargetBlock: number;
  mempoolSize: number;
  totalTransactions: number;
  avgBlockTime: number;
  avgTransactionFee: number;
  marketCap: number; // Changed from optional to required
  txCount24h: number; // Changed from optional to required
  btcSent24h: number; // Changed from optional to required
}

// Chart data types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

export interface ChartResponse {
  status: string;
  name: string;
  unit: string;
  period: string;
  description: string;
  values: Array<{
    x: number; // timestamp
    y: number; // value
  }>;
}

export interface ChartInfo {
  id: string;
  name: string;
  description: string;
  unit: string;
  period?: string;
  category: ChartCategory;
  color: string;
}

export type ChartCategory = 
  | 'market' 
  | 'blockchain' 
  | 'mining' 
  | 'network';

export interface ChartTimeRange {
  label: string;
  days: number;
}

// Mining pool types
export interface MiningPoolDistribution {
  name: string;
  share: number;
  color: string;
}

// Market data types
export interface MarketDominanceData {
  name: string;
  value: number;
  color: string;
}

// WebSocket callback types
export type MessageCallback = (data: any) => void;
export type ErrorCallback = (error: Event) => void;

// GitHub API types
export interface GitHubAsset {
  name: string;
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
  description?: string;
}

export interface GitHubRelease {
  name: string;
  published_at: string;
  body: string;
  assets: GitHubAsset[];
}

// Format options
export interface NumberFormatOptions {
  notation?: 'compact' | 'standard';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}