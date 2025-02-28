import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Clock, Database, ArrowRight, Calendar, Hash } from 'lucide-react';
import websocketService from '../services/websocketService';
import { fetchLatestBlocks } from '../utils/api';
import { BlockData } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Container, PageHeader, Spinner, Skeleton } from '../components/ui';

export const BlockExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First load blocks from API
    const loadInitialBlocks = async () => {
      setIsLoading(true);
      try {
        const latestBlocks = await fetchLatestBlocks(20);
        setBlocks(latestBlocks);
      } catch (error) {
        console.error('Error loading initial blocks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialBlocks();

    // Connect to WebSocket for real-time updates
    websocketService.connect()
      .then(() => {
        setIsConnected(!websocketService.isUsingMockData());
        
        // Subscribe to new blocks
        websocketService.subscribeToNewBlocks();
        
        // Handle new blocks
        websocketService.onMessage('block', (data) => {
          const block = data.x;
          
          // Add new block to the list
          setBlocks(prev => {
            const newBlock: BlockData = {
              hash: block.hash,
              height: block.height,
              time: block.time,
              size: block.size,
              txCount: block.nTx,
              miner: getMinerFromCoinbase(block)
            };
            
            // Check if block already exists
            if (prev.some(b => b.hash === newBlock.hash)) {
              return prev;
            }
            
            return [newBlock, ...prev].slice(0, 20);
          });
          
          setIsLoading(false);
        });
        
        // Handle WebSocket errors
        websocketService.onError(() => {
          setIsConnected(false);
        });

        // If using mock data, generate mock blocks
        if (websocketService.isUsingMockData()) {
          // We already loaded blocks from API or mock data
        }
      })
      .catch(() => {
        setIsConnected(false);
      });
    
    return () => {
      // Clean up
      websocketService.unsubscribeFromNewBlocks();
      websocketService.disconnect();
    };
  }, []);

  // Extract miner information from coinbase transaction
  const getMinerFromCoinbase = (block: any): string => {
    // In a real implementation, this would parse the coinbase transaction
    // For now, return a random mining pool
    const miners = [
      'Foundry USA',
      'AntPool',
      'F2Pool',
      'Binance Pool',
      'ViaBTC',
      'SlushPool'
    ];
    
    return miners[Math.floor(Math.random() * miners.length)];
  };

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Container>
      <PageHeader 
        title="Block Explorer" 
        description="Browse the latest Bitcoin blocks"
        icon={<Zap className="w-8 h-8" />}
        actions={
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
          </div>
        }
      />

      {isLoading ? (
        <Card className="mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Height</th>
                  <th>Hash</th>
                  <th>Mined</th>
                  <th>Transactions</th>
                  <th>Size</th>
                  <th>Miner</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(10)].map((_, index) => (
                  <tr key={index} className="hover:bg-[#0B1017]/50 transition-colors">
                    <td>
                      <Skeleton height="1.25rem" width="80px" />
                    </td>
                    <td>
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <Skeleton height="1.25rem" width="150px" />
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <Skeleton height="1rem" width="80px" className="mb-1" />
                        <Skeleton height="0.75rem" width="120px" />
                      </div>
                    </td>
                    <td>
                      <Skeleton height="1rem" width="60px" />
                    </td>
                    <td>
                      <Skeleton height="1rem" width="60px" />
                    </td>
                    <td>
                      <Skeleton height="1rem" width="100px" />
                    </td>
                    <td>
                      <Skeleton height="1rem" width="60px" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="mb-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Height</th>
                  <th>Hash</th>
                  <th>Mined</th>
                  <th>Transactions</th>
                  <th>Size</th>
                  <th>Miner</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((block, index) => (
                  <tr key={index} className="hover:bg-[#0B1017]/50 transition-colors">
                    <td>{block.height}</td>
                    <td>
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                        <span className="font-mono">{block.hash.substring(0, 16)}...</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span>{formatTime(block.time)}</span>
                        <span className="text-sm text-gray-400">{formatTimeAgo(block.time)}</span>
                      </div>
                    </td>
                    <td>{block.txCount}</td>
                    <td>{formatBytes(block.size)}</td>
                    <td>{block.miner}</td>
                    <td>
                      <Link to={`/block/${block.hash}`} className="text-blue-500 hover:text-blue-400">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </Container>
  );
};