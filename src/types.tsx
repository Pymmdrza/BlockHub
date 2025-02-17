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

// Transaction Input
export interface TransactionVin {
  txid: string;
  vout: number;
  sequence: number;
  n: number;
  addresses: string[];
  isAddress: boolean;
  value: string;
}

// Transaction Output
export interface TransactionVout {
  value: string;
  n: number;
  hex: string;
  addresses: string[];
  isAddress: boolean;
}

// Transaction Response
export interface TransactionResponse {
  txid: string;
  version: number;
  lockTime: number;
  vin: TransactionVin[];
  vout: TransactionVout[];
  blockHash: string;
  blockHeight: number;
  confirmations: number;
  blockTime: number;
  size: number;
  vsize: number;
  value: string;
  valueIn: string;
  fees: string;
  hex: string;
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
