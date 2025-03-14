// Bitcoin address validation (no changes)
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

// Transaction ID validation (modified with heuristic)
export const isTransactionId = (txid: string): boolean => {
  // Transaction ID must be exactly 64 characters long and contain only hexadecimal characters
  const txidFormat = /^[a-fA-F0-9]{64}$/;
  if (!txidFormat.test(txid)) {
    return false; // Not a valid hex format or length
  }

  // Heuristic: Transaction IDs are less likely to start with 6 consecutive zeros
  const leadingZeros = txid.substring(0, 6);
  if (leadingZeros === '000000') {
    return false; // If it starts with 6 zeros, likely a Block Hash (heuristic)
  }

  return true; // Likely a Transaction ID based on heuristic
};

// Block hash validation (modified with heuristic)
export const isBlockHash = (hash: string): boolean => {
  // Block hash must be exactly 64 characters long and contain only hexadecimal characters
  const blockHashFormat = /^[a-fA-F0-9]{64}$/;
  if (!blockHashFormat.test(hash)) {
    return false; // Not a valid hex format or length
  }

  // Heuristic: Block Hashes are more likely to start with 6 consecutive zeros
  const leadingZeros = hash.substring(0, 12);
  if (leadingZeros === '000000000000') {
    return true; // Likely a Block Hash based on heuristic
  }

  return false; // Not likely a Block Hash based on heuristic
};

// Block height validation (no changes)
export const isBlockHeight = (height: number): boolean => {
  // Current Bitcoin block height is around 800,000 as of 2025
  // This is a simple validation to ensure the height is reasonable
  return height >= 0 && height < 1000000;
};