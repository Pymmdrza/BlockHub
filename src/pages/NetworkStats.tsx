import React, { useEffect, useState, useRef } from 'react';
import { BarChart2, TrendingUp, Clock, Database, Zap, Server, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import websocketService from '../services/websocketService';
import { fetchNetworkStats } from '../utils/api';
import { NetworkInfo, ChartDataPoint } from '../types';
import { Card, CardContent, CardHeader, CardTitle, Container, PageHeader, Spinner, Skeleton } from '../components/ui';

export const NetworkStats: React.FC = () => {
  const [stats, setStats] = useState<NetworkInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [hashRateHistory, setHashRateHistory] = useState<ChartDataPoint[]>([]);
  const [difficultyHistory, setDifficultyHistory] = useState<ChartDataPoint[]>([]);
  const [mempoolHistory, setMempoolHistory] = useState<ChartDataPoint[]>([]);
  const [feeHistory, setFeeHistory] = useState<ChartDataPoint[]>([]);
  const [txCountHistory, setTxCountHistory] = useState<ChartDataPoint[]>([]);
  const [btcSentHistory, setBtcSentHistory] = useState<ChartDataPoint[]>([]);
  const [newBlockCount, setNewBlockCount] = useState(0);
  const [newTxCount, setNewTxCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // First load network stats from API
    const loadInitialStats = async () => {
      setIsLoading(true);
      try {
        const networkStats = await fetchNetworkStats();
        setStats(networkStats);
        
        // Initialize chart data with the fetched stats
        const now = Date.now();
        
        // Initialize hash rate history
        const initialHashRate = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.hashRate * (0.98 + Math.random() * 0.04)
        }));
        setHashRateHistory(initialHashRate);
        
        // Initialize difficulty history
        const initialDifficulty = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.difficulty * (0.999 + Math.random() * 0.002)
        }));
        setDifficultyHistory(initialDifficulty);
        
        // Initialize mempool history
        const initialMempool = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.mempoolSize * (0.95 + Math.random() * 0.1)
        }));
        setMempoolHistory(initialMempool);
        
        // Initialize fee history
        const initialFee = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.avgTransactionFee * (0.95 + Math.random() * 0.1)
        }));
        setFeeHistory(initialFee);
        
        // Initialize transaction count history
        const initialTxCount = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.txCount24h ? networkStats.txCount24h / 24 * (0.9 + Math.random() * 0.2) : 15000
        }));
        setTxCountHistory(initialTxCount);
        
        // Initialize BTC sent history
        const initialBtcSent = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: networkStats.btcSent24h ? networkStats.btcSent24h / 24 * (0.9 + Math.random() * 0.2) : 10000
        }));
        setBtcSentHistory(initialBtcSent);
      } catch (error) {
        console.error('Error loading initial network stats:', error);
        
        // Initialize with default values if API call fails
        const now = Date.now();
        const initialHashRate = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 350 + Math.random() * 10
        }));
        setHashRateHistory(initialHashRate);
        
        const initialDifficulty = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 78 + Math.random() * 1
        }));
        setDifficultyHistory(initialDifficulty);
        
        const initialMempool = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 240 + Math.random() * 20
        }));
        setMempoolHistory(initialMempool);
        
        const initialFee = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 0.0002 + Math.random() * 0.0001
        }));
        setFeeHistory(initialFee);
        
        const initialTxCount = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 15000 + Math.random() * 3000
        }));
        setTxCountHistory(initialTxCount);
        
        const initialBtcSent = Array.from({ length: 20 }, (_, i) => ({
          timestamp: now - (19 - i) * 60000,
          value: 10000 + Math.random() * 2000
        }));
        setBtcSentHistory(initialBtcSent);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialStats();
    
    // Connect to WebSocket for real-time updates
    websocketService.connect()
      .then(() => {
        setIsConnected(!websocketService.isUsingMockData());
        
        // Subscribe to new blocks and transactions
        websocketService.subscribeToNewBlocks();
        websocketService.subscribeToNewTransactions();
        
        // Handle new blocks
        websocketService.onMessage('block', (data) => {
          setNewBlockCount(prev => prev + 1);
          
          // Update network stats with new block data
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              blockHeight: data.x.height,
              timestamp: Date.now()
            };
          });
          
          // Update chart data
          const now = Date.now();
          setHashRateHistory(prev => {
            const newData = [...prev, { timestamp: now, value: prev.length > 0 ? prev[prev.length - 1].value * (0.98 + Math.random() * 0.04) : 350 }];
            return newData.slice(-50); // Keep last 50 data points
          });
          
          setDifficultyHistory(prev => {
            const newData = [...prev, { timestamp: now, value: prev.length > 0 ? prev[prev.length - 1].value : 78.3 }];
            return newData.slice(-50);
          });
        });
        
        // Handle new transactions
        websocketService.onMessage('utx', (data) => {
          setNewTxCount(prev => prev + 1);
          
          // Update mempool size
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              unconfirmedTxs: prev.unconfirmedTxs + 1,
              mempoolSize: prev.mempoolSize + (data.x.size / 1024 / 1024), // Convert bytes to MB
              timestamp: Date.now()
            };
          });
          
          // Update chart data
          const now = Date.now();
          setMempoolHistory(prev => {
            const newData = [...prev, { timestamp: now, value: prev.length > 0 ? prev[prev.length - 1].value + (data.x.size / 1024 / 1024) : 250 }];
            return newData.slice(-50);
          });
          
          // Update fee history
          const fee = data.x.out.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000;
          setFeeHistory(prev => {
            const newData = [...prev, { timestamp: now, value: fee }];
            return newData.slice(-50);
          });
          
          // Update transaction count history
          setTxCountHistory(prev => {
            const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 15000;
            const newData = [...prev, { timestamp: now, value: lastValue + 1 }];
            return newData.slice(-50);
          });
          
          // Update BTC sent history
          const btcSent = data.x.out.reduce((sum: number, output: any) => sum + (output.value || 0), 0) / 100000000;
          setBtcSentHistory(prev => {
            const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 10000;
            const newData = [...prev, { timestamp: now, value: lastValue + btcSent }];
            return newData.slice(-50);
          });
        });
        
        // Handle WebSocket errors
        websocketService.onError(() => {
          setIsConnected(false);
        });
      })
      .catch(() => {
        setIsConnected(false);
      });
    
    // Simulate data updates if WebSocket is not available
    intervalRef.current = setInterval(() => {
      if (websocketService.isUsingMockData()) {
        const now = Date.now();
        
        // Update hash rate
        setHashRateHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 350;
          const newValue = lastValue * (0.98 + Math.random() * 0.04);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update difficulty
        setDifficultyHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 78.3;
          const newValue = lastValue * (0.999 + Math.random() * 0.002);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update mempool
        setMempoolHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 250;
          const newValue = lastValue * (0.95 + Math.random() * 0.1);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update fee
        setFeeHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 0.00023;
          const newValue = lastValue * (0.95 + Math.random() * 0.1);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update transaction count
        setTxCountHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 15000;
          const newValue = lastValue * (0.98 + Math.random() * 0.04);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update BTC sent
        setBtcSentHistory(prev => {
          const lastValue = prev.length > 0 ? prev[prev.length - 1].value : 10000;
          const newValue = lastValue * (0.98 + Math.random() * 0.04);
          const newData = [...prev, { timestamp: now, value: newValue }];
          return newData.slice(-50);
        });
        
        // Update stats
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            timestamp: now,
            hashRate: hashRateHistory.length > 0 ? hashRateHistory[hashRateHistory.length - 1].value : 350.5,
            difficulty: difficultyHistory.length > 0 ? difficultyHistory[difficultyHistory.length - 1].value : 78.3,
            mempoolSize: mempoolHistory.length > 0 ? mempoolHistory[mempoolHistory.length - 1].value : 250,
            avgTransactionFee: feeHistory.length > 0 ? feeHistory[feeHistory.length - 1].value : 0.00023
          };
        });
        
        // Simulate new blocks and transactions
        if (Math.random() > 0.8) {
          setNewBlockCount(prev => prev + 1);
          setStats(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              blockHeight: prev.blockHeight + 1
            };
          });
        }
        
        setNewTxCount(prev => prev + Math.floor(Math.random() * 5));
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            unconfirmedTxs: prev.unconfirmedTxs + Math.floor(Math.random() * 5)
          };
        });
      }
    }, 5000);
    
    return () => {
      // Clean up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      websocketService.unsubscribeFromNewBlocks();
      websocketService.unsubscribeFromNewTransactions();
      websocketService.disconnect();
    };
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatValue = (value: number) => {
    return value.toFixed(2);
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent border-orange-500 rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading network statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <BarChart2 className="w-8 h-8 text-orange-500" />
          <div>
            <h1 className="text-2xl font-bold">Network Statistics</h1>
            <p className="text-gray-400">Real-time Bitcoin network metrics and trends</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-400">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Hash Rate</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.hashRate.toFixed(2)} EH/s
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Global computing power securing the network
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Zap className="w-4 h-4" />
            <span>Difficulty</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.difficulty.toFixed(2)} T
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Network mining difficulty
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Database className="w-4 h-4" />
            <span>Mempool Size</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.mempoolSize.toFixed(2)} MB
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Size of unconfirmed transactions
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Server className="w-4 h-4" />
            <span>Unconfirmed Transactions</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.unconfirmedTxs.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Transactions waiting to be included in blocks
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Clock className="w-4 h-4" />
            <span>Average Block Time</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.avgBlockTime.toFixed(1)} minutes
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Average time between blocks
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Average Transaction Fee</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.avgTransactionFee.toFixed(5)} BTC
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Average fee per transaction
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Zap className="w-4 h-4" />
            <span>Latest Block</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.blockHeight.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Current blockchain height
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Activity className="w-4 h-4" />
            <span>24h Transactions</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {stats.txCount24h ? formatNumber(stats.txCount24h) : "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Transactions in the last 24 hours
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Hash Rate (EH/s)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hashRateHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} EH/s`, 'Hash Rate']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ED8936" 
                  fill="#ED8936"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Difficulty (T)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={difficultyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} T`, 'Difficulty']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#4299E1" 
                  fill="#4299E1"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Mempool Size (MB)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mempoolHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} MB`, 'Mempool Size']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#48BB78" 
                  fill="#48BB78"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Transaction Fees (BTC)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => value.toFixed(5)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [`${Number(value).toFixed(5)} BTC`, 'Fee']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#F6AD55" 
                  fill="#F6AD55"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Transactions per Hour</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={txCountHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [formatNumber(value), 'Transactions']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#805AD5" 
                  fill="#805AD5"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">BTC Sent per Hour</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={btcSentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  labelFormatter={(label) => new Date(label).toLocaleString()}
                  formatter={(value: any) => [formatNumber(value) + " BTC", 'Volume']}
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                  itemStyle={{ color: '#F7FAFC' }}
                  labelStyle={{ color: '#A0AEC0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#D53F8C" 
                  fill="#D53F8C"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-400" />
                <span>New Blocks</span>
              </div>
              <div className="bg-blue-900/20 px-3 py-1 rounded-full text-blue-400 text-sm">
                {newBlockCount}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-green-400" />
                <span>New Transactions</span>
              </div>
              <div className="bg-green-900/20 px-3 py-1 rounded-full text-green-400 text-sm">
                {newTxCount}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                <span>Last Updated</span>
              </div>
              <div className="text-gray-400 text-sm">
                {new Date(stats.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Network Health</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Hash Rate Stability</span>
                <span className="text-green-400">Excellent</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Mempool Congestion</span>
                <span className="text-yellow-400">Moderate</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Fee Pressure</span>
                <span className="text-orange-400">High</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Network Security</span>
                <span className="text-green-400">Very High</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};