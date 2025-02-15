export interface AddressResponse {
  page: number;
  totalPages: number;
  itemsOnPage: number;
  address: string;
  balance: string;
  totalReceived: string;
  totalSent: string;
  unconfirmedBalance: string;
  unconfirmedTxs: number;
  txs: number;
  txids: string[];
}

export interface TransactionVin {
  txid: string;
  vout: number;
  sequence: number;
  n: number;
  addresses: string[];
  isAddress: boolean;
  value: string;
}

export interface TransactionVout {
  value: string;
  n: number;
  hex: string;
  addresses: string[];
  isAddress: boolean;
}

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
