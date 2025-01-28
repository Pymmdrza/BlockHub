import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isBitcoinAddress, isTransactionId } from '../utils/validation';
import { Notification } from './Notification';

export const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const navigate = useNavigate();

  const validateInput = (input: string): string | null => {
    if (!input.trim()) {
      return 'Please enter a Bitcoin address or transaction ID';
    }

    if (input.length < 64) {
      // Validate as Bitcoin address
      if (!isBitcoinAddress(input)) {
        return 'Invalid Bitcoin address format';
      }
    } else {
      // Validate as transaction ID
      if (!isTransactionId(input)) {
        return 'Invalid transaction ID format';
      }
    }

    return null;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateInput(query);
    if (validationError) {
      setError(validationError);
      setShowNotification(true);
      return;
    }

    const path = query.length < 64 ? 'address' : 'tx';
    navigate(`/${path}/${query.trim()}`);
  };

  return (
    <>
      <form onSubmit={handleSearch} className="w-full">
        <div className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Bitcoin address or transaction ID..."
            className="w-full px-5 py-4 pl-5 pr-14 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 transition-all duration-200"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
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