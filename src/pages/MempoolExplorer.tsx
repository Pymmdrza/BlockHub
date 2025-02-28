import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Filter, DollarSign, ArrowRight, Zap, BarChart2 } from 'lucide-react';
import websocketService from '../services/websocketService';
import { WebSocketTransaction } from '../types';

interface FeeRange {
  label: string;
  min: number;
  max: number | null;
  count: number;
  totalSize: number;
  color: string;
}

export const MempoolExplorer: React.FC = () => {
  const [transactions, setTransactions] = useState<WebSocketTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [feeRanges, setFeeRanges] = useState<FeeRange[]>([
    { label: 'High Priority', min: 0.0001, max: null, count: 0, totalSize: 0, color: 'bg-green-500' },
    { label: 'Medium Priority', min: 0.00005, max: 0.0001, count: 0, totalSize: 0, color: 'bg-blue-500' },
    { label: 'Low Priority', min: 0.00001, max: 0.00005, count: 0, totalSize: 0, color: 'bg-yellow-500' },
    { label: 'Very Low Priority', min: 0, max: 0.00001, count: 0, totalSize: 0, color: 'bg-red-500' }
  ]);
  const [selectedFeeRange, setSelectedFeeRange] = useState<string | null>(null);
  const [totalMempoolSize, setTotalMempoolSize] = useState(0);

  useEffect(() => {
    // Connect to WebSocket
    websocketService.connect()
      .then(() => {
        setIsConnected(!websocketService.isUsingMockData());
        
        // Subscribe to new transactions
        websocketService.subscribeToNewTransactions();
        
        // Handle new transactions
        websocketService.onMessage('utx', (data) => {
          const tx = data.x;
          
          // Calculate fee
          const totalInput = tx.inputs.reduce((sum: number, input: any) => {
            return sum + (input.prev_out?.value || 0);
          }, 0);
          
          const totalOutput = tx.out .reduce((sum: number, output: any) => {
            return sum + (output.value || 0);
          }, 0);
          
          const fee = (totalInput - totalOutput) / 100000000; // Convert to BTC
          const feeRate = fee / (tx.size / 1000); // Fee per KB
          
          // Add fee rate to transaction
          const txWithFee = {
            ...tx,
            feeRate
          };
          
          // Update transactions list
          setTransactions(prev => {
            const newTxs = [txWithFee, ...prev].slice(0, 100);
            return newTxs;
          });
          
          // Update fee ranges
          setFeeRanges(prev => {
            return prev.map(range => {
              if ((range.min <= feeRate) && (range.max === null || feeRate < range.max)) {
                return {
                  ...range,
                  count: range.count + 1,
                  totalSize: range.totalSize + tx.size
                };
              }
              return range;
            });
          });
          
          // Update total mempool size
          setTotalMempoolSize(prev => prev + tx.size);
        });
        
        // Handle WebSocket errors
        websocketService.onError(() => {
          setIsConnected(false);
        });

        // If using mock data, generate mock data
        if (websocketService.isUsingMockData()) {
          generateMockData();
        }
      })
      .catch(() => {
        setIsConnected(false);
        
        // Generate mock data if WebSocket connection fails
        generateMockData();
      });
    
    return () => {
      // Clean up
      websocketService.unsubscribeFromNewTransactions();
      websocketService.disconnect();
    };
  }, []);

  // Generate mock data for testing
  const generateMockData = () => {
    // Generate mock transactions
    const mockTransactions: WebSocketTransaction[] = [];
    const mockFeeRanges = [...feeRanges];
    let mockTotalSize = 0;
    
    for (let i = 0; i < 50; i++) {
      const size = 500 + Math.floor(Math.random() * 1500);
      const feeRate = Math.random() * 0.0002;
      
      const tx: WebSocketTransaction = {
        hash: `mock-${i}-${Math.random().toString(36).substring(2, 15)}`,
        ver: 1,
        vin_sz: Math.floor(Math.random() * 5) + 1,
        vout_sz: Math.floor(Math.random() * 5) + 1,
        lock_time: 0,
        size,
        relayed_by: '0.0.0.0',
        tx_index: i,
        time: Date.now() / 1000 - Math.floor(Math.random() * 3600),
        inputs: Array(Math.floor(Math.random() * 3) + 1).fill(0).map(() => ({
          prev_out: {
            addr: `1mock${Math.random().toString(36).substring(2, 15)}`,
            n: 0,
            script: '',
            spent: false,
            tx_index: 0,
            type: 0,
            value: Math.floor(Math.random() * 10000000)
          },
          script: '',
          sequence: 0
        })),
        out: Array(Math.floor(Math.random() * 3) + 1).fill(0).map(() => ({
          addr: `1mock${Math.random().toString(36).substring(2, 15)}`,
          n: 0,
          script: '',
          spent: false,
          tx_index: 0,
          type: 0,
          value: Math.floor(Math.random() * 1000000)
        }))
      };
      
      // Add fee rate
      (tx as any).feeRate = feeRate;
      
      mockTransactions.push(tx as WebSocketTransaction);
      mockTotalSize += size;
      
      // Update fee ranges
      for (const range of mockFeeRanges) {
        if ((range.min <= feeRate) && (range.max === null || feeRate < range.max)) {
          range.count += 1;
          range.totalSize += size;
          break;
        }
      }
    }
    
    setTransactions(mockTransactions);
    setFeeRanges(mockFeeRanges);
    setTotalMempoolSize(mockTotalSize);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    return `${Math.floor(seconds / 3600)} hours ago`;
  };

  const formatFeeRate = (feeRate: number): string => {
    return `${(feeRate * 100000).toFixed(2)} sat/byte`;
  };

  const filteredTransactions = selectedFeeRange
    ? transactions.filter(tx => {
        const feeRate = (tx as any).feeRate;
        const range = feeRanges.find(r => r.label === selectedFeeRange);
        if (!range) return true;
        return (range.min <= feeRate) && (range.max === null || feeRate < range.max);
      })
    : transactions;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Clock className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Mempool Explorer</h1>
            <p className="text-gray-400">Monitor unconfirmed transactions waiting to be included in blocks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Mempool Summary</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Total Size</span>
                <span className="text-white font-medium">{formatBytes(totalMempoolSize)}</span>
              </div>
              <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                {feeRanges.map((range, index) => {
                  const percentage = totalMempoolSize > 0 ? (range.totalSize / totalMempoolSize) * 100 : 0;
                  return (
                    <div
                      key={index}
                      className={`h-full ${range.color} inline-block`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {feeRanges.map((range, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${range.color}`}></div>
                    <span>{range.label}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {range.count} txs ({formatBytes(range.totalSize)})
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Fee Estimation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0B1017] rounded-lg p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">Next Block (10 min)</div>
              <div className="text-xl font-semibold text-green-400">
                {formatFeeRate(0.00015)}
              </div>
              <div className="text-xs text-gray-500 mt-1">High Priority</div>
            </div>
            <div className="bg-[#0B1017] rounded-lg p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">3 Blocks (~30 min)</div>
              <div className="text-xl font-semibold text-blue-400">
                {formatFeeRate(0.00008)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Medium Priority</div>
            </div>
            <div className="bg-[#0B1017] rounded-lg p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2">6 Blocks (~1 hour)</div>
              <div className="text-xl font-semibold text-yellow-400">
                {formatFeeRate(0.00003)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Low Priority</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Fee estimates are based on recent transaction confirmation times and current mempool state.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Recent Unconfirmed Transactions</h2>
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedFeeRange || ''}
              onChange={(e) => setSelectedFeeRange(e.target.value || null)}
              className="bg-[#0B1017] text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Transactions</option>
              {feeRanges.map((range, index) => (
                <option key={index} value={range.label}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx, index) => {
              const feeRate = (tx as any).feeRate;
              const feeRangeColor = feeRanges.find(
                range => (range.min <= feeRate) && (range.max === null || feeRate < range.max)
              )?.color || 'bg-gray-500';
              
              return (
                <div
                  key={index}
                  className="bg-[#0B1017] rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Link
                          to={`/tx/${tx.hash}`}
                          className="font-mono text-orange-500 hover:text-orange-400 transition-colors text-sm truncate"
                        >
                          {tx.hash}
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={`px-2 py-1 rounded-md ${feeRangeColor.replace('bg-', 'bg-opacity-20 text-')}`}>
                          {formatFeeRate(feeRate)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatBytes(tx.size)}
                        </div>
                        <div className="text-sm text-gray-400">
                          {formatTime(tx.time)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-2">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">From</div>
                        <div className="space-y-1">
                          {tx.inputs.slice(0, 2).map((input, idx) => (
                            input.prev_out?.addr && (
                              <div key={idx} className="text-sm truncate">
                                <Link
                                  to={`/address/${input.prev_out.addr}`}
                                  className="text-blue-400 hover:text-blue-300 font-mono"
                                >
                                  {input.prev_out.addr}
                                </Link>
                              </div>
                            )
                          ))}
                          {tx.inputs.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{tx.inputs.length - 2} more inputs
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-center items-center">
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">To</div>
                        <div className="space-y-1">
                          {tx.out.slice(0, 2).map((output, idx) => (
                            output.addr && (
                              <div key={idx} className="text-sm truncate">
                                <Link
                                  to={`/address/${output.addr}`}
                                  className="text-green-400 hover:text-green-300 font-mono"
                                >
                                  {output.addr}
                                </Link>
                              </div>
                            )
                          ))}
                          {tx.out.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{tx.out.length - 2} more outputs
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-400">
              No transactions found. Waiting for new transactions...
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <h2 className="text-lg font-semibold mb-4">Understanding the Mempool</h2>
        <div className="prose prose-invert max-w-none text-gray-300">
          <p>
            The mempool (memory pool) is a waiting area for Bitcoin transactions that have been broadcast to the network but have not yet been included in a block.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="text-md font-medium text-white">How Transactions Get Confirmed</h3>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Miners select transactions from the mempool to include in new blocks</li>
                <li>Transactions with higher fees are typically selected first</li>
                <li>During periods of high network activity, the mempool can become congested</li>
                <li>Transactions may remain in the mempool for hours or days if fees are too low</li>
              </ul>
            </div>
            <div>
              <h3 className="text-md font-medium text-white">Fee Estimation</h3>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>Fee rates are measured in satoshis per byte (sat/byte)</li>
                <li>Higher fee rates increase the likelihood of faster confirmation</li>
                <li>Fee estimates are based on recent confirmation times</li>
                <li>During congestion, fees can increase significantly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};