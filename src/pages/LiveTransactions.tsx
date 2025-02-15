import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchLiveTransactions } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { LiveTransaction } from '../types';
import { Activity, ArrowLeft, ArrowRight, Copy, Filter } from 'lucide-react';

export const LiveTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<LiveTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [filterValue, setFilterValue] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const fetchTransactions = async () => {
    try {
      const newTxs = await fetchLiveTransactions();
      setTransactions(prev => {
        const combined = [...newTxs, ...prev];
        return combined.slice(0, 100);
      });
      setIsConnected(true);
    } catch (error) {
      console.error('Error fetching live transactions:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
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

      <div className="space-y-4">
        {filteredTransactions.map((tx) => (
          <div
            key={tx.hash}
            className="bg-[#0E141B] rounded-lg p-4 border border-gray-800 animate-fade-in"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <div className="flex items-center gap-2 min-w-0 max-w-full">
                  <span className="font-mono text-orange-500 text-sm truncate" title={tx.hash}>
                    {truncateAddress(tx.hash, 32)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(tx.hash)}
                    className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                    title="Copy transaction ID"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-sm text-gray-400 flex-shrink-0 ml-4">
                  {formatTime(tx.time)}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-4">
                <div className="bg-[#0B1017] rounded-lg border border-gray-800 p-3">
                  <div className="text-sm text-gray-400 mb-2">From</div>
                  <div className="space-y-2">
                    {tx.inputs?.map((input, index) => (
                      input.prev_out?.addr && (
                        <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="truncate">
                              <Link
                                to={`/address/${input.prev_out.addr}`}
                                className="text-orange-500 hover:text-orange-400 font-mono text-sm"
                                title={input.prev_out.addr}
                              >
                                {truncateAddress(input.prev_out.addr, 24)}
                              </Link>
                            </div>
                          </div>
                          <span className="text-sm text-gray-400 flex-shrink-0">
                            {formatValue(input.prev_out.value)} BTC
                          </span>
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
                        <div key={index} className="flex items-center justify-between gap-2 min-w-0">
                          <div className="min-w-0 flex-1">
                            <div className="truncate">
                              <Link
                                to={`/address/${output.addr}`}
                                className="text-green-500 hover:text-green-400 font-mono text-sm"
                                title={output.addr}
                              >
                                {truncateAddress(output.addr, 24)}
                              </Link>
                            </div>
                          </div>
                          <span className="text-sm text-gray-400 flex-shrink-0">
                            {formatValue(output.value)} BTC
                          </span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

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
    </div>
  );
};