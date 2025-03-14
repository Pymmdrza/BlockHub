export interface BlockTransaction {
  hash: string;
  size: number;
  fee: number;
  time: number;
  inputs: any[];
  out: any[];
}

export interface BlockInfo {
  hash: string;
  height: number;
  time: number;
  size: number;
  txCount: number;
  prevBlockHash: string;
  nextBlockHash: string;
  merkleRoot: string;
  version: number;
  bits: number;
  nonce: number;
  weight: number;
  difficulty: number;
  transactions: BlockTransaction[];
  reward: number;
  miner: string;
} 