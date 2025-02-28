// Bitcoin address validation
export const isBitcoinAddress = (address: string): boolean => {
  // Basic Bitcoin address format validation
  const legacyFormat = /^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/; // Legacy address format (starts with 1)
  const segwitFormat = /^[3][a-km-zA-HJ-NP-Z1-9]{25,34}$/; // SegWit address format (starts with 3)
  const nativeSegwitFormat = /^(bc1)[a-zA-HJ-NP-Z0-9]{25,39}$/; // Native SegWit (starts with bc1)

  return (
    legacyFormat.test(address) ||
    segwitFormat.test(address) ||
    nativeSegwitFormat.test(address)
  );
};

// Transaction ID validation
export const isTransactionId = (txid: string): boolean => {
  // Transaction ID must be exactly 64 characters long and contain only hexadecimal characters
  const txidFormat = /^[a-fA-F0-9]{64}$/;
  return txidFormat.test(txid);
};

// Block hash validation
export const isBlockHash = (hash: string): boolean => {
  // Block hash must be exactly 64 characters long and contain only hexadecimal characters
  const blockHashFormat = /^[a-fA-F0-9]{64}$/;
  return blockHashFormat.test(hash);
};

// Block height validation
export const isBlockHeight = (height: number): boolean => {
  // Current Bitcoin block height is around 800,000 as of 2025
  // This is a simple validation to ensure the height is reasonable
  return height >= 0 && height < 1000000;
};