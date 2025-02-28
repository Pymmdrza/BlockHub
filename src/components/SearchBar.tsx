import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isBitcoinAddress, isTransactionId, isBlockHash, isBlockHeight } from '../utils/validation';
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

    // Check if it's a block height (numeric)
    if (/^\d+$/.test(input)) {
      if (!isBlockHeight(parseInt(input, 10))) {
        return 'Invalid block height';
      }
      return null;
    }

    // Check if it's a block hash (64 hex chars)
    if (input.length === 64 && /^[a-fA-F0-9]+$/.test(input)) {
      if (!isBlockHash(input)) {
        return 'Invalid block hash format';
      }
      return null;
    }

    // Check if it's a transaction ID (64 hex chars)
    if (input.length === 64) {
      if (!isTransactionId(input)) {
        return 'Invalid transaction ID format';
      }
      return null;
    }

    // Check if it's a Bitcoin address
    if (!isBitcoinAddress(input)) {
      return 'Invalid Bitcoin address format';
    }

    return null;
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

    // Check if it's a block height (numeric)
    if (/^\d+$/.test(trimmedQuery)) {
      navigate(`/block/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Check if it's a block hash (64 hex chars)
    if (trimmedQuery.length === 64 && isBlockHash(trimmedQuery)) {
      navigate(`/block/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Check if it's a transaction ID (64 hex chars)
    if (trimmedQuery.length === 64) {
      navigate(`/tx/${trimmedQuery}`);
      setQuery('');
      return;
    }

    // Must be a Bitcoin address
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