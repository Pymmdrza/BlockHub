import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { Bitcoin, Activity, BarChart2, Clock, Database, ArrowRight, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { fetchBitcoinPrice, fetchLatestBlocks, fetchNetworkStats } from '../utils/api';
import { BitcoinPrice as BitcoinPriceType, BlockData, NetworkInfo, ChartDataPoint } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Container, StatCard, Spinner, Skeleton, SkeletonText } from '../components/ui';

export const Home: React.FC = () => {
  const [price, setPrice] = useState<BitcoinPriceType | null>(null);
  const [latestBlocks, setLatestBlocks] = useState<BlockData[]>([]);
  const [networkStats, setNetworkStats] = useState<NetworkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceLoading, setIsPriceLoading] = useState(true);
  const [isNetworkStatsLoading, setIsNetworkStatsLoading] = useState(true);
  const [isBlocksLoading, setIsBlocksLoading] = useState(true);
  const [hashRateHistory, setHashRateHistory] = useState<ChartDataPoint[]>([]);
  const [priceHistory, setPriceHistory] = useState<ChartDataPoint[]>([]);
  const [mempoolHistory, setMempoolHistory] = useState<ChartDataPoint[]>([]);
  const [blockHeightHistory, setBlockHeightHistory] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Load data in parallel with independent loading states
    const loadData = async () => {
      // Load Bitcoin price
      const loadPrice = async () => {
        setIsPriceLoading(true);
        try {
          const priceData = await fetchBitcoinPrice();
          setPrice(priceData);
          
          // Generate price history data
          const now = Date.now();
          const priceHistoryData = Array.from({ length: 20 }, (_, i) => {
            const timestamp = now - (19 - i) * 60000;
            // Simulate price fluctuations around the current price
            const fluctuation = (Math.random() * 0.02) - 0.01; // -1% to +1%
            const historicalPrice = priceData.USD.last * (1 + fluctuation);
            return { timestamp, value: historicalPrice };
          });
          setPriceHistory(priceHistoryData);
        } catch (error) {
          console.error('Error loading price data:', error);
        } finally {
          setIsPriceLoading(false);
        }
      };
      
      // Load network stats
      const loadNetworkStats = async () => {
        setIsNetworkStatsLoading(true);
        try {
          const statsData = await fetchNetworkStats();
          setNetworkStats(statsData);
          
          // Generate hash rate history data
          const now = Date.now();
          const hashRateData = Array.from({ length: 20 }, (_, i) => {
            const timestamp = now - (19 - i) * 60000;
            // Simulate hash rate fluctuations
            const fluctuation = (Math.random() * 0.04) - 0.02; // -2% to +2%
            const historicalHashRate = statsData.hashRate * (1 + fluctuation);
            return { timestamp, value: historicalHashRate };
          });
          setHashRateHistory(hashRateData);
          
          // Generate mempool history data
          const mempoolData = Array.from({ length: 20 }, (_, i) => {
            const timestamp = now - (19 - i) * 60000;
            // Simulate mempool size fluctuations
            const fluctuation = (Math.random() * 0.1) - 0.05; // -5% to +5%
            const historicalMempool = statsData.mempoolSize * (1 + fluctuation);
            return { timestamp, value: historicalMempool };
          });
          setMempoolHistory(mempoolData);
          
          // Generate block height history data
          const blockHeightData = Array.from({ length: 20 }, (_, i) => {
            const timestamp = now - (19 - i) * 60000;
            // Block height increases by 1 approximately every 10 minutes
            const blocksBack = Math.floor(i / 10);
            return { timestamp, value: statsData.blockHeight - blocksBack };
          });
          setBlockHeightHistory(blockHeightData);
        } catch (error) {
          console.error('Error loading network stats:', error);
        } finally {
          setIsNetworkStatsLoading(false);
        }
      };
      
      // Load latest blocks
      const loadBlocks = async () => {
        setIsBlocksLoading(true);
        try {
          const blocksData = await fetchLatestBlocks(5);
          setLatestBlocks(blocksData);
        } catch (error) {
          console.error('Error loading blocks data:', error);
        } finally {
          setIsBlocksLoading(false);
        }
      };

      // Start all data loading in parallel
      await Promise.all([
        loadPrice(),
        loadNetworkStats(),
        loadBlocks()
      ]);
      
      setIsLoading(false);
    };

    loadData();
    const interval = setInterval(loadData, 60000); // Update data every minute

    return () => clearInterval(interval);
  }, []);

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

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  // Calculate blocks until next retarget
  const getBlocksUntilRetarget = (): string => {
    if (!networkStats || !networkStats.nextRetargetBlock) return "N/A";
    
    const blocksRemaining = networkStats.nextRetargetBlock - networkStats.blockHeight;
    if (blocksRemaining <= 0) return "Imminent";
    
    // Estimate time based on average block time
    const minutesRemaining = blocksRemaining * networkStats.avgBlockTime;
    const daysRemaining = minutesRemaining / (60 * 24);
    
    if (daysRemaining < 1) {
      const hoursRemaining = minutesRemaining / 60;
      return `${blocksRemaining} blocks (${Math.round(hoursRemaining)} hours)`;
    }
    
    return `${blocksRemaining} blocks (${daysRemaining.toFixed(1)} days)`;
  };

  // Handle click on Latest Block card
  const handleLatestBlockClick = () => {
    if (networkStats && networkStats.latestBlockHash) {
      window.location.href = `/block/${networkStats.latestBlockHash}`;
    } else {
      window.location.href = '/blocks';
    }
  };

  return (
    <Container>
      <Card className="mb-8">
        <CardContent className="py-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">
              Bitcoin Explorer
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Search for Bitcoin addresses, transactions, and blocks to explore the blockchain
            </p>
            <SearchBar />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Bitcoin Price"
          value={price ? `$${price.USD.last.toLocaleString()}` : "$0.00"}
          icon={<Bitcoin className="w-5 h-5" />}
          trend={price ? {
            value: price.USD.change_24h,
            isPositive: price.USD.change_24h >= 0
          } : undefined}
          isLoading={isPriceLoading}
          chartData={priceHistory}
          chartColor="#ED8936"
          description={price ? `Market Cap: $${(networkStats?.marketCap || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}` : undefined}
        />

        <StatCard
          title="Hash Rate"
          value={networkStats ? `${networkStats.hashRate.toFixed(2)} EH/s` : "0 EH/s"}
          icon={<BarChart2 className="w-5 h-5" />}
          onClick={() => window.location.href = '/network'}
          isLoading={isNetworkStatsLoading}
          chartData={hashRateHistory}
          chartColor="#3B82F6"
          description={networkStats ? `Difficulty: ${networkStats.difficulty.toFixed(2)} T` : undefined}
        />

        <StatCard
          title="Mempool Size"
          value={networkStats ? `${networkStats.mempoolSize.toFixed(2)} MB` : "0 MB"}
          icon={<Clock className="w-5 h-5" />}
          onClick={() => window.location.href = '/mempool'}
          isLoading={isNetworkStatsLoading}
          chartData={mempoolHistory}
          chartColor="#10B981"
          description={networkStats ? `${formatNumber(networkStats.unconfirmedTxs)} unconfirmed txs` : undefined}
        />

        <StatCard
          title="Latest Block"
          value={networkStats ? networkStats.blockHeight.toLocaleString() : "0"}
          icon={<Database className="w-5 h-5" />}
          onClick={handleLatestBlockClick}
          isLoading={isNetworkStatsLoading}
          chartData={blockHeightHistory}
          chartColor="#8B5CF6"
          description={networkStats ? `Avg. block time: ${networkStats.avgBlockTime.toFixed(1)} min` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="24h Transactions"
          value={networkStats?.txCount24h ? formatNumber(networkStats.txCount24h) : "0"}
          icon={<Activity className="w-5 h-5" />}
          isLoading={isNetworkStatsLoading}
          chartColor="#F59E0B"
        />

        <StatCard
          title="24h BTC Sent"
          value={networkStats?.btcSent24h ? `${formatNumber(networkStats.btcSent24h)} BTC` : "0 BTC"}
          icon={<DollarSign className="w-5 h-5" />}
          isLoading={isNetworkStatsLoading}
          chartColor="#EC4899"
        />

        <StatCard
          title="Avg Transaction Fee"
          value={networkStats ? `${networkStats.avgTransactionFee.toFixed(5)} BTC` : "0 BTC"}
          icon={<TrendingUp className="w-5 h-5" />}
          isLoading={isNetworkStatsLoading}
          chartColor="#6366F1"
        />

        <StatCard
          title="Block Reward"
          value="3.125 BTC"
          icon={<Zap className="w-5 h-5" />}
          isLoading={isNetworkStatsLoading}
          description={`Until retarget: ${getBlocksUntilRetarget()}`}
          chartColor="#EF4444"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Latest Blocks</CardTitle>
              <Link to="/blocks" className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </CardHeader>
            
            <CardContent className="p-0">
              {isBlocksLoading ? (
                <div className="divide-y divide-gray-800">
                  {[...Array(5)].map((_, index) => (
                    <div key={index} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-orange-500/10 p-2 rounded-lg">
                            <Database className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="space-y-2">
                            <Skeleton height="1.25rem" width="120px" />
                            <Skeleton height="0.875rem" width="80px" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton height="1rem" width="100px" />
                          <Skeleton height="0.875rem" width="60px" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : latestBlocks.length > 0 ? (
                <div className="divide-y divide-gray-800">
                  {latestBlocks.map((block, index) => (
                    <Link
                      key={index}
                      to={`/block/${block.hash}`}
                      className="flex items-center justify-between p-4 hover:bg-[#131c25] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-orange-500/10 p-2 rounded-lg">
                          <Database className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">Block #{block.height.toLocaleString()}</p>
                          <p className="text-sm text-gray-400">{formatTimeAgo(block.time)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-300">{block.txCount} transactions</p>
                        <p className="text-sm text-gray-400">{formatBytes(block.size)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <p className="text-gray-400">No blocks found</p>
                    <button 
                      onClick={() => setIsBlocksLoading(true)}
                      className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bitcoin Network</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-[#0B1017]">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Network Health</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Hash Rate</span>
                      <span className="text-sm text-green-400">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Mempool</span>
                      <span className="text-sm text-yellow-400">Moderate</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Fee Pressure</span>
                      <span className="text-sm text-orange-400">High</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1017]">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Market Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Cap:</span>
                    <span className="text-white">${(networkStats?.marketCap || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">24h Volume:</span>
                    <span className="text-white">${(networkStats?.btcSent24h || 0 * (price?.USD.last || 0)).toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Circulating Supply:</span>
                    <span className="text-white">~19.5M BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max Supply:</span>
                    <span className="text-white">21M BTC</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1017]">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-white mb-2">Latest Updates</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-gray-300">Network difficulty adjusted +2.3%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-gray-300">Hash rate reached new all-time high</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-gray-300">Mempool size increased by 15%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
};