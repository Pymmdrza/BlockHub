import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchLiveTransactions } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { LiveTransaction } from '../types';
import { Activity, ArrowLeft, ArrowRight, Copy, Filter, Clock, DollarSign } from 'lucide-react';

export const LiveTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [filterValue, setFilterValue] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const newTxs = await fetchLiveTransactions();
      setTransactions(prev => {
        const combined = [...newTxs, ...prev];
        // Ensure unique transactions by hash
        const uniqueTxs = Array.from(
          new Map(combined.map(tx => [tx.hash, tx])).values()
        );
        return uniqueTxs.slice(0, 100);
      });
      setIsConnected(true);
      setError(null);
    } catch (error) {
      console.error('Error fetching live transactions:', error);
      setIsConnected(false);
      setError('Failed to fetch live transactions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 30000); // Increased interval to 30 seconds to reduce API load
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp * 1000) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  };

  const formatValue = (value: number) => {
    return (value / 100000000).toFixed(8);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTotalValue = (tx: LiveTransaction): number => {
    return tx.out.reduce((sum, output) => sum + output.value, 0) / 100000000;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (!filterValue) return true;
    const totalValue = getTotalValue(tx);
    return totalValue >= filterValue;
  });

  const handleRetry = () => {
    fetchTransactions();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Live Transactions</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
            <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterValue || ''}
            onChange={(e) => setFilterValue(e.target.value ? Number(e.target.value) : null)}
            className="bg-[#0B1017] text-gray-200 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Transactions</option>
            <option value="0.1">≥ 0.1 BTC</option>
            <option value="0.5">≥ 0.5 BTC</option>
            <option value="1">≥ 1 BTC</option>
            <option value="5">≥ 5 BTC</option>
            <option value="10">≥ 10 BTC</option>
            <option value="50">≥ 50 BTC</option>
            <option value="100">≥ 100 BTC</option>
          </select>
          <span className="text-sm text-gray-400">
            {filterValue ? `Showing transactions ≥ ${filterValue} BTC` : 'Showing all transactions'}
          </span>
        </div>
      </div>

      {isLoading && transactions.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading transactions...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-[#0E141B] rounded-lg p-6 border border-red-800 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => {
            const totalValue = getTotalValue(tx);
            return (
              <div
                key={tx.hash}
                className="bg-[#0E141B] rounded-lg p-4 border border-gray-800 animate-fade-in hover:border-gray-700 transition-all"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-800 pb-4 gap-3">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Link
                        to={`/tx/${tx.hash}`}
                        className="font-mono text-orange-500 hover:text-orange-400 transition-colors text-sm break-all"
                        style={{
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word'
                        }}
                      >
                        {tx.hash}
                      </Link>
                      <button 
                        onClick={() => copyToClipboard(tx.hash)}
                        className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                        title="Copy transaction ID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-2 bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-800/30">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-medium">
                          {totalValue.toFixed(8)} BTC
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm whitespace-nowrap">
                          {formatTime(tx.time)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4">
                    <div className="bg-[#0B1017] rounded-lg border border-gray-800 p-3">
                      <div className="text-sm text-gray-400 mb-2">From</div>
                      <div className="space-y-2">
                        {tx.inputs?.map((input, index) => (
                          input.prev_out?.addr && (
                            <div key={`${tx.hash}-input-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/address/${input.prev_out.addr}`}
                                  className="text-orange-500 hover:text-orange-400 font-mono text-sm break-all"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {input.prev_out.addr}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-400 flex-shrink-0 whitespace-nowrap">
                                {formatValue(input.prev_out.value)} BTC
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center items-center">
                      <div className="w-8 h-8 bg-[#0E141B] rounded-full flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </div>

                    <div className="bg-[#0B1017] rounded-lg border border-gray-800 p-3">
                      <div className="text-sm text-gray-400 mb-2">To</div>
                      <div className="space-y-2">
                        {tx.out.map((output, index) => (
                          output.addr && (
                            <div key={`${tx.hash}-output-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="min-w-0 flex-1">
                                <Link
                                  to={`/address/${output.addr}`}
                                  className="text-green-500 hover:text-green-400 font-mono text-sm break-all"
                                  style={{
                                    wordBreak: 'break-word',
                                    overflowWrap: 'break-word'
                                  }}
                                >
                                  {output.addr}
                                </Link>
                              </div>
                              <div className="text-sm text-gray-400 flex-shrink-0 whitespace-nowrap">
                                {formatValue(output.value)} BTC
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTransactions.length === 0 && (
            <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800 text-center">
              <p className="text-gray-400">
                {transactions.length === 0 
                  ? 'Waiting for new transactions...' 
                  : 'No transactions match the selected filter'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};