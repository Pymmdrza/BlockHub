import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isBitcoinAddress, isTransactionId, isBlockHash, isBlockHeight } from '../utils/validation'; // Make sure to import the updated validation functions
import { Notification } from './Notification';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();

  const validateInput = (input: string): string | null => {
    if (!input.trim()) {
      return 'Please enter a search term';
    }

    const trimmedInput = input.trim(); // Trim input once to avoid repetition

    // Check if it's a Bitcoin address (FIRST, because addresses are shorter and have specific prefixes)
    if (isBitcoinAddress(trimmedInput)) {
      return null; // Valid Bitcoin address
    }

    // Check if it's a block height (numeric)
    if (/^\d+$/.test(trimmedInput)) {
      if (!isBlockHeight(parseInt(trimmedInput, 10))) {
        return 'Invalid block height';
      }
      return null; // Valid block height
    }

    // Check if it's a block hash (64 hex chars and starts with zeros - heuristic)
    if (trimmedInput.length === 64 && /^[a-fA-F0-9]+$/.test(trimmedInput)) {
      if (isBlockHash(trimmedInput)) { // Use the updated isBlockHash function
        return null; // Valid Block Hash (heuristic)
      }
      // If not likely a block hash, check if it's a Transaction ID
      if (isTransactionId(trimmedInput)) { // Use the updated isTransactionId function
        return null; // Valid Transaction ID (heuristic)
      }
      return 'Invalid Block Hash or Transaction ID format'; // Neither Block Hash nor Transaction ID (heuristic)
    }


    // If none of the above, and not a valid address in the first check, then it's an invalid address format
    return 'Invalid Bitcoin address format'; // Fallback to invalid address format if not caught earlier
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedQuery = query.trim();
    const validationError = validateInput(trimmedQuery);

    if (validationError) {
      setError(validationError);
      setShowNotification(true);
      return;
    }

    // Check if it's a block height (numeric) - Order is important, check block height first for numbers
    if (/^\d+$/.test(trimmedQuery)) {
      navigate(`/block/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Check if it's a block hash (64 hex chars and starts with zeros - heuristic)
    if (trimmedQuery.length === 64 && isBlockHash(trimmedQuery)) { // Use updated isBlockHash
      navigate(`/block/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Check if it's a transaction ID (64 hex chars and NOT starting with many zeros - heuristic)
    if (trimmedQuery.length === 64 && isTransactionId(trimmedQuery)) { // Use updated isTransactionId
      navigate(`/tx/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Must be a Bitcoin address (if it passed validation and is not block height/hash/txid)
    navigate(`/address/${trimmedQuery}`);
    setQuery('');
  };

  return (
    <>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by address, transaction, block hash or height..."
            className="w-full px-5 py-4 pl-5 pr-14 rounded-lg bg-[#0B1017] border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder-gray-500 text-gray-100 transition-all duration-200"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-orange-500 transition-colors rounded-full hover:bg-gray-800"
          >
            <Search className="w-6 h-6" />
          </button>
        </div>
      </form>

      <Notification
        message={error}
        type="error"
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </>
  );
};