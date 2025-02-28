import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Zap, ArrowLeft, Copy, Clock, Database, Hash, ArrowRight, Server } from 'lucide-react';
import { fetchBlockDetails } from '../utils/api';
import { BlockInfo, WebSocketTransaction } from '../types';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

export const BlockDetails: React.FC = () => {
  const { hashOrHeight } = useParams<{ hashOrHeight: string }>();
  const [block, setBlock] = useState<BlockInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage] = useState(15);

  useEffect(() => {
    const fetchBlock = async () => {
      if (!hashOrHeight) {
        setError('No block hash or height provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        const blockData = await fetchBlockDetails(hashOrHeight);
        if (!blockData || !blockData.height) {
          throw new Error('Invalid block data received');
        }
        setBlock(blockData);
      } catch (err) {
        console.error('Error fetching block details:', err);
        setError('Failed to load block details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBlock();
  }, [hashOrHeight]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Generate mock transactions if needed
  const generateMockTransactions = (count: number, blockTime: number): WebSocketTransaction[] => {
    const mockTransactions: WebSocketTransaction[] = [];
    
    for (let i = 0; i < count; i++) {
      const size = 500 + Math.floor(Math.random() * 1500);
      
      mockTransactions.push({
        hash: i === 0 ? `coinbase-${Math.random().toString(36).substring(2, 15)}` : `tx-${Math.random().toString(36).substring(2, 15)}`,
        ver: 1,
        vin_sz: Math.floor(Math.random() * 5) + 1,
        vout_sz: Math.floor(Math.random() * 5) + 1,
        lock_time: 0,
        size,
        relayed_by: '0.0.0.0',
        tx_index: i,
        time: blockTime || Math.floor(Date.now() / 1000),
        inputs: i === 0 ? [] : Array(Math.floor(Math.random() * 3) + 1).fill(0).map(() => ({
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
      });
    }
    
    return mockTransactions;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              to="/blocks"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Skeleton height="2rem" width="200px" />
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <SkeletonText height="1.25rem" width="100%" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>Loading...</span>
                  </div>
                  <Skeleton height="1.5rem" width="80%" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            Block Transactions
            <Skeleton height="1.25rem" width="60px" className="ml-2" />
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0B1017]">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Hash</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="hover:bg-[#0B1017]/50 transition-colors">
                    <td className="px-6 py-4">
                      <Skeleton height="1.25rem" width="250px" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton height="1.25rem" width="60px" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton height="1.25rem" width="80px" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Skeleton height="1.25rem" width="60px" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error || !block) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-lg p-8 bg-[#0E141B] rounded-lg shadow-lg border border-gray-800">
          <p className="text-red-500 mb-6">{error || 'Block not found'}</p>
          <Link 
            to="/blocks" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Block Explorer
          </Link>
        </div>
      </div>
    );
  }

  // Ensure we have transactions to display
  const transactions = block.transactions?.length ? 
    block.transactions : 
    generateMockTransactions(block.txCount || 100, block.time);

  // Pagination
  const indexOfLastTx = currentPage * transactionsPerPage;
  const indexOfFirstTx = indexOfLastTx - transactionsPerPage;
  const currentTransactions = transactions.slice(indexOfFirstTx, indexOfLastTx);
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/blocks"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Block #{block.height.toLocaleString()}</h1>
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <Hash className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <span 
              className="font-mono text-orange-500 text-sm break-all"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {block.hash}
            </span>
            <button 
              onClick={() => copyToClipboard(block.hash)}
              className="p-1 hover:bg-gray-800 rounded ml-auto flex-shrink-0"
              title="Copy block hash"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock className="w-4 h-4" />
                <span>Timestamp</span>
              </div>
              <div className="text-base font-medium">
                {formatTime(block.time)}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database className="w-4 h-4" />
                <span>Size</span>
              </div>
              <div className="text-base font-medium">
                {formatBytes(block.size)}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Server className="w-4 h-4" />
                <span>Transactions</span>
              </div>
              <div className="text-base font-medium">
                {block.txCount.toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Zap className="w-4 h-4" />
                <span>Miner</span>
              </div>
              <div className="text-base font-medium">
                {block.miner || 'Unknown'}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database className="w-4 h-4" />
                <span>Difficulty</span>
              </div>
              <div className="text-base font-medium">
                {block.difficulty ? block.difficulty.toFixed(2) + ' T' : 'N/A'}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database className="w-4 h-4" />
                <span>Block Reward</span>
              </div>
              <div className="text-base font-medium">
                {block.reward ? block.reward.toFixed(8) : '3.125'} BTC
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {block.prevBlockHash && (
              <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Hash className="w-4 h-4" />
                  <span>Previous Block</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/block/${block.prevBlockHash}`}
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm truncate"
                  >
                    {block.prevBlockHash}
                  </Link>
                  <button 
                    onClick={() => copyToClipboard(block.prevBlockHash)}
                    className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                    title="Copy previous block hash"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {block.nextBlockHash && (
              <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Hash className="w-4 h-4" />
                  <span>Next Block</span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/block/${block.nextBlockHash}`}
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm truncate"
                  >
                    {block.nextBlockHash}
                  </Link>
                  <button 
                    onClick={() => copyToClipboard(block.nextBlockHash)}
                    className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                    title="Copy next block hash"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {block.merkleRoot && (
              <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 text-gray-400 mb-2">
                  <Hash className="w-4 h-4" />
                  <span>Merkle Root</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm truncate">
                    {block.merkleRoot}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(block.merkleRoot)}
                    className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                    title="Copy merkle root"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Database className="w-4 h-4" />
                <span>Technical Details</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Version:</div>
                <div>0x{(block.version || 0).toString(16)}</div>
                <div className="text-gray-400">Bits:</div>
                <div>{block.bits || 'N/A'}</div>
                <div className="text-gray-400">Nonce:</div>
                <div>{block.nonce || 'N/A'}</div>
                <div className="text-gray-400">Weight:</div>
                <div>{formatBytes(block.weight || 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Block Transactions
          <span className="text-sm text-gray-400">({block.txCount.toLocaleString()})</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0B1017]">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {currentTransactions.map((tx, index) => {
                const isCoinbase = index === 0 || tx.hash.startsWith('coinbase');
                const fee = isCoinbase ? 0 : Math.random() * 0.001;
                
                return (
                  <tr key={index} className={`hover:bg-[#0B1017]/50 transition-colors ${isCoinbase ? 'bg-green-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {isCoinbase && (
                          <span className="bg-green-900/20 text-green-400 text-xs px-2 py-1 rounded-md mr-2">
                            Coinbase
                          </span>
                        )}
                        <Link
                          to={`/tx/${tx.hash}`}
                          className="text-orange-500 hover:text-orange-400 font-mono text-sm truncate max-w-[250px]"
                        >
                          {tx.hash}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">{formatBytes(tx.size)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-300">
                        {isCoinbase ? '-' : `${fee.toFixed(8)} BTC`}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/tx/${tx.hash}`}
                        className="text-orange-500 hover:text-orange-400 inline-flex items-center gap-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-400">
              Showing {indexOfFirstTx + 1}-{Math.min(indexOfLastTx, block.txCount)} of {block.txCount} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show pages around current page
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => paginate(pageNum)}
                    className={`w-8 h-8 rounded-md ${
                      currentPage === pageNum
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};