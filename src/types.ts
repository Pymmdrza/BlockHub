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
  transactions?: any[];
  reward?: number;
}

// WebSocket Block types
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

// WebSocket Transaction types
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

// Network Stats types
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
  marketCap?: number;
  txCount24h?: number;
  btcSent24h?: number;
}

// Chart data types
export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

export interface TransactionFee {
  timestamp: number;
  avgFee: number;
  minFee: number;
  maxFee: number;
}

export interface BlockData {
  hash: string;
  height: number;
  time: number;
  size: number;
  txCount: number;
  miner?: string;
}

// Market data types
export interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  timestamp: number;
}

// Bitcoin network stats for dashboard
export interface BitcoinStats {
  hashRate: number;
  difficulty: number;
  blockHeight: number;
  unconfirmedTxs: number;
  mempoolSize: number;
  txCount24h: number;
  btcSent24h: number;
  avgBlockTime: number;
  avgFee: number;
  timestamp: number;
}

// Blockchain.com Charts API types
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

export interface MiningPoolDistribution {
  name: string;
  share: number;
  color: string;
}

export interface MarketDominanceData {
  name: string;
  value: number;
  color: string;
}