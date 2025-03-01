import React, { useEffect, useState, useRef } from 'react';
import { BarChart2, TrendingUp, Clock, Database, Zap, Server, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
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
  
  // Update interval in milliseconds (1 hour)
  const UPDATE_INTERVAL = 60 * 60 * 1000;
  
  // Number of data points to display in charts (24 hours)
  const DATA_POINTS = 24;

  useEffect(() => {
    // First load network stats from API
    const loadInitialStats = async () => {
      setIsLoading(true);
      try {
        const networkStats = await fetchNetworkStats();
        setStats(networkStats);
        
        // Initialize chart data with the fetched stats
        const now = Date.now();
        
        // Generate historical data points with hourly intervals (24 hours)
        const hourlyInterval = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Create timestamps for the last 24 hours (one per hour)
        const timestamps = Array.from({ length: DATA_POINTS }, (_, i) => 
          now - (DATA_POINTS - 1 - i) * hourlyInterval
        );
        
        // Initialize hash rate history - realistic daily pattern
        // Hash rate typically shows a gradual increase with occasional dips
        const initialHashRate = timestamps.map((timestamp, i) => {
          // Base value with slight upward trend
          const baseValue = networkStats.hashRate * 0.95;
          // Daily pattern with maintenance dips
          const hourOfDay = new Date(timestamp).getHours();
          // Hash rate often dips during early morning hours (3-5 AM)
          const timeOfDayFactor = hourOfDay >= 3 && hourOfDay <= 5 
            ? 0.92 + (Math.random() * 0.03) 
            : 1.0 + (Math.random() * 0.05);
          
          return {
            timestamp,
            value: baseValue * (1 + (i / DATA_POINTS) * 0.1) * timeOfDayFactor
          };
        });
        setHashRateHistory(initialHashRate);
        
        // Initialize difficulty history - step function
        // Difficulty adjusts every 2016 blocks (approximately 2 weeks)
        // For a 24-hour view, difficulty should be constant with a possible adjustment
        const shouldShowAdjustment = Math.random() > 0.85; // 15% chance to show an adjustment
        const adjustmentHour = shouldShowAdjustment ? Math.floor(Math.random() * 24) : -1;
        
        const initialDifficulty = timestamps.map((timestamp, i) => {
          const hourOfDay = new Date(timestamp).getHours();
          // If we're showing an adjustment and we've passed the adjustment hour
          const difficultyValue = (shouldShowAdjustment && hourOfDay >= adjustmentHour) 
            ? networkStats.difficulty * 1.05 // 5% increase
            : networkStats.difficulty;
            
          return {
            timestamp,
            value: difficultyValue
          };
        });
        setDifficultyHistory(initialDifficulty);
        
        // Initialize mempool size history - follows daily cycle
        // Mempool typically grows during high activity hours and shrinks when blocks are mined
        const initialMempool = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          
          // Mempool tends to be larger during business hours (9 AM - 6 PM)
          // and smaller during night hours
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - higher activity
            timeFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            // Evening hours - moderate activity
            timeFactor = 0.9 + (Math.random() * 0.2);
          } else {
            // Early morning hours - lower activity
            timeFactor = 0.7 + (Math.random() * 0.2);
          }
          
          return {
            timestamp,
            value: networkStats.mempoolSize * timeFactor
          };
        });
        setMempoolHistory(initialMempool);
        
        // Initialize fee history - correlates with mempool size
        // Transaction fees increase when mempool is congested
        const initialFee = timestamps.map((timestamp, i) => {
          const hourOfDay = new Date(timestamp).getHours();
          
          // Fees follow similar pattern to mempool but with more volatility
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - higher fees
            timeFactor = 1.3 + (Math.random() * 0.4);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            // Evening hours - moderate fees
            timeFactor = 0.9 + (Math.random() * 0.3);
          } else {
            // Early morning hours - lower fees
            timeFactor = 0.6 + (Math.random() * 0.2);
          }
          
          return {
            timestamp,
            value: networkStats.avgTransactionFee * timeFactor
          };
        });
        setFeeHistory(initialFee);
        
        // Initialize transaction count history - daily pattern
        // Transaction volume follows typical daily activity patterns
        const initialTxCount = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          const dayOfWeek = new Date(timestamp).getDay(); // 0 = Sunday, 6 = Saturday
          
          // Weekend factor - typically lower volume on weekends
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
          
          // Hour of day factor - follows typical daily activity
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - peak activity
            hourFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            // Evening hours - moderate activity
            hourFactor = 0.9 + (Math.random() * 0.2);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            // Night hours - low activity
            hourFactor = 0.5 + (Math.random() * 0.2);
          } else {
            // Early morning hours - increasing activity
            hourFactor = 0.7 + (Math.random() * 0.2);
          }
          
          const baseCount = networkStats.txCount24h ? networkStats.txCount24h / 24 : 15000;
          return {
            timestamp,
            value: baseCount * hourFactor * weekendFactor
          };
        });
        setTxCountHistory(initialTxCount);
        
        // Initialize BTC sent history - follows similar pattern to transaction count
        // but with more volatility due to occasional large transactions
        const initialBtcSent = timestamps.map((timestamp, i) => {
          const hourOfDay = new Date(timestamp).getHours();
          const dayOfWeek = new Date(timestamp).getDay();
          
          // Weekend factor
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0;
          
          // Hour of day factor
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            hourFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            hourFactor = 0.9 + (Math.random() * 0.2);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            hourFactor = 0.5 + (Math.random() * 0.2);
          } else {
            hourFactor = 0.7 + (Math.random() * 0.2);
          }
          
          // Occasional large transactions (whales)
          const whaleFactor = Math.random() > 0.9 ? 1.5 + Math.random() : 1.0;
          
          const baseSent = networkStats.btcSent24h ? networkStats.btcSent24h / 24 : 10000;
          return {
            timestamp,
            value: baseSent * hourFactor * weekendFactor * whaleFactor
          };
        });
        setBtcSentHistory(initialBtcSent);
      } catch (error) {
        console.error('Error loading initial network stats:', error);
        
        // Initialize with default values if API call fails
        const now = Date.now();
        const hourlyInterval = 60 * 60 * 1000; // 1 hour in milliseconds
        
        // Create timestamps for the last 24 hours (one per hour)
        const timestamps = Array.from({ length: DATA_POINTS }, (_, i) => 
          now - (DATA_POINTS - 1 - i) * hourlyInterval
        );
        
        // Generate mock data with realistic daily patterns
        const initialHashRate = timestamps.map((timestamp, i) => {
          const hourOfDay = new Date(timestamp).getHours();
          const timeOfDayFactor = hourOfDay >= 3 && hourOfDay <= 5 ? 0.95 : 1.0 + (Math.random() * 0.03);
          return {
            timestamp,
            value: 350 + (i / DATA_POINTS) * 5 + (Math.random() * 3) * timeOfDayFactor
          };
        });
        setHashRateHistory(initialHashRate);
        
        // Mock difficulty with possible adjustment
        const shouldShowAdjustment = Math.random() > 0.85;
        const adjustmentHour = shouldShowAdjustment ? Math.floor(Math.random() * 24) : -1;
        
        const initialDifficulty = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          const difficultyValue = (shouldShowAdjustment && hourOfDay >= adjustmentHour) 
            ? 78.3 * 1.05 
            : 78.3;
          return {
            timestamp,
            value: difficultyValue
          };
        });
        setDifficultyHistory(initialDifficulty);
        
        // Mock mempool with daily pattern
        const initialMempool = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            timeFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            timeFactor = 0.9 + (Math.random() * 0.2);
          } else {
            timeFactor = 0.7 + (Math.random() * 0.2);
          }
          return {
            timestamp,
            value: 240 * timeFactor
          };
        });
        setMempoolHistory(initialMempool);
        
        // Mock fee with daily pattern
        const initialFee = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            timeFactor = 1.3 + (Math.random() * 0.4);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            timeFactor = 0.9 + (Math.random() * 0.3);
          } else {
            timeFactor = 0.6 + (Math.random() * 0.2);
          }
          return {
            timestamp,
            value: 0.0002 * timeFactor
          };
        });
        setFeeHistory(initialFee);
        
        // Mock transaction count with daily pattern
        const initialTxCount = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          const dayOfWeek = new Date(timestamp).getDay();
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            hourFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            hourFactor = 0.9 + (Math.random() * 0.2);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            hourFactor = 0.5 + (Math.random() * 0.2);
          } else {
            hourFactor = 0.7 + (Math.random() * 0.2);
          }
          return {
            timestamp,
            value: 15000 * hourFactor * weekendFactor
          };
        });
        setTxCountHistory(initialTxCount);
        
        // Mock BTC sent with daily pattern
        const initialBtcSent = timestamps.map((timestamp) => {
          const hourOfDay = new Date(timestamp).getHours();
          const dayOfWeek = new Date(timestamp).getDay();
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0;
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            hourFactor = 1.2 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            hourFactor = 0.9 + (Math.random() * 0.2);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            hourFactor = 0.5 + (Math.random() * 0.2);
          } else {
            hourFactor = 0.7 + (Math.random() * 0.2);
          }
          const whaleFactor = Math.random() > 0.9 ? 1.5 + Math.random() : 1.0;
          return {
            timestamp,
            value: 10000 * hourFactor * weekendFactor * whaleFactor
          };
        });
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
        });
        
        // Handle WebSocket errors
        websocketService.onError(() => {
          setIsConnected(false);
        });
      })
      .catch(() => {
        setIsConnected(false);
      });
    
    // Simulate data updates at a reasonable interval
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      
      // Only update charts once per hour to maintain the 24-hour view
      // This simulates getting new hourly data points
      
      // Update hash rate with realistic hourly changes
      setHashRateHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          const hourOfDay = new Date(now).getHours();
          
          // Hash rate changes based on time of day
          let newValue;
          if (hourOfDay >= 3 && hourOfDay <= 5) {
            // Early morning dip (mining pool maintenance)
            newValue = lastValue * (0.97 + Math.random() * 0.04);
          } else {
            // Normal slight increase or stability
            newValue = lastValue * (0.99 + Math.random() * 0.03);
          }
          
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update difficulty - changes in steps (every ~2 weeks in Bitcoin)
      setDifficultyHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          
          // Difficulty stays constant most of the time, with occasional adjustments
          // For a 24-hour view, we'll rarely see an adjustment
          const shouldAdjust = Math.random() > 0.98; // 2% chance of adjustment per hour
          const newValue = shouldAdjust ? lastValue * (0.98 + Math.random() * 0.07) : lastValue;
          
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update mempool - fluctuates based on transaction activity and time of day
      setMempoolHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          const hourOfDay = new Date(now).getHours();
          
          // Mempool size changes based on time of day
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - higher activity
            timeFactor = 1.1 + (Math.random() * 0.2);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            // Evening hours - moderate activity
            timeFactor = 0.95 + (Math.random() * 0.1);
          } else {
            // Early morning hours - lower activity
            timeFactor = 0.85 + (Math.random() * 0.1);
          }
          
          const newValue = lastValue * timeFactor;
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update fee - correlates with mempool size
      setFeeHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          const hourOfDay = new Date(now).getHours();
          
          // Fee changes based on time of day and mempool congestion
          let timeFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - higher fees
            timeFactor = 1.1 + (Math.random() * 0.3);
          } else if ((hourOfDay >= 19 && hourOfDay <= 23) || (hourOfDay >= 0 && hourOfDay <= 2)) {
            // Evening hours - moderate fees
            timeFactor = 0.9 + (Math.random() * 0.2);
          } else {
            // Early morning hours - lower fees
            timeFactor = 0.8 + (Math.random() * 0.15);
          }
          
          const newValue = lastValue * timeFactor;
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update transaction count - follows daily patterns
      setTxCountHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          const hourOfDay = new Date(now).getHours();
          const dayOfWeek = new Date(now).getDay();
          
          // Weekend factor
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1.0;
          
          // Hour of day factor
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            // Business hours - peak activity
            hourFactor = 1.1 + (Math.random() * 0.2);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            // Evening hours - moderate activity
            hourFactor = 0.9 + (Math.random() * 0.15);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            // Night hours - low activity
            hourFactor = 0.7 + (Math.random() * 0.15);
          } else {
            // Early morning hours - increasing activity
            hourFactor = 0.8 + (Math.random() * 0.15);
          }
          
          const newValue = lastValue * hourFactor * weekendFactor;
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update BTC sent - follows similar pattern to transaction count
      setBtcSentHistory(prev => {
        if (prev.length === 0) return prev;
        
        const lastTimestamp = prev[prev.length - 1].timestamp;
        // Only add a new point if at least an hour has passed
        if (now - lastTimestamp >= UPDATE_INTERVAL) {
          const lastValue = prev[prev.length - 1].value;
          const hourOfDay = new Date(now).getHours();
          const dayOfWeek = new Date(now).getDay();
          
          // Weekend factor
          const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.85 : 1.0;
          
          // Hour of day factor
          let hourFactor;
          if (hourOfDay >= 9 && hourOfDay <= 18) {
            hourFactor = 1.1 + (Math.random() * 0.2);
          } else if ((hourOfDay >= 19 && hourOfDay <= 22)) {
            hourFactor = 0.9 + (Math.random() * 0.15);
          } else if (hourOfDay >= 23 || hourOfDay <= 5) {
            hourFactor = 0.7 + (Math.random() * 0.15);
          } else {
            hourFactor = 0.8 + (Math.random() * 0.15);
          }
          
          // Occasional large transactions (whales)
          const whaleFactor = Math.random() > 0.9 ? 1.5 + Math.random() : 1.0;
          
          const newValue = lastValue * hourFactor * weekendFactor * whaleFactor;
          const newData = [...prev.slice(1), { timestamp: now, value: newValue }];
          return newData;
        }
        return prev;
      });
      
      // Update stats
      setStats(prev => {
        if (!prev) return prev;
        
        // Get the latest values from the charts
        const latestHashRate = hashRateHistory.length > 0 ? hashRateHistory[hashRateHistory.length - 1].value : prev.hashRate;
        const latestDifficulty = difficultyHistory.length > 0 ? difficultyHistory[difficultyHistory.length - 1].value : prev.difficulty;
        const latestMempoolSize = mempoolHistory.length > 0 ? mempoolHistory[mempoolHistory.length - 1].value : prev.mempoolSize;
        const latestFee = feeHistory.length > 0 ? feeHistory[feeHistory.length - 1].value : prev.avgTransactionFee;
        
        return {
          ...prev,
          timestamp: now,
          hashRate: latestHashRate,
          difficulty: latestDifficulty,
          mempoolSize: latestMempoolSize,
          avgTransactionFee: latestFee
        };
      });
      
      // Simulate new blocks occasionally (roughly every 10 minutes in Bitcoin)
      if (Math.random() > 0.95) { // 5% chance per update interval
        setNewBlockCount(prev => prev + 1);
        setStats(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            blockHeight: prev.blockHeight + 1
          };
        });
      }
      
      // Simulate new transactions more frequently
      const newTxs = Math.floor(Math.random() * 5);
      setNewTxCount(prev => prev + newTxs);
      setStats(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          unconfirmedTxs: prev.unconfirmedTxs + newTxs
        };
      });
    }, UPDATE_INTERVAL);
    
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
    // Format timestamp to show hour of day (e.g., "14:00")
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateTimestamp = (timestamp: number) => {
    // Format timestamp to show date and time
    return new Date(timestamp).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
            <p className="text-gray-400">24-hour Bitcoin network metrics and trends</p>
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
            {stats.totalTransactions ? formatNumber(stats.totalTransactions) : "N/A"}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Transactions in the last 24 hours
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Hash Rate (EH/s) - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hashRateHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="Hash Rate"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Hash rate typically shows maintenance dips during early morning hours (3-5 AM) and gradual increases during the day.</p>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Difficulty (T) - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={difficultyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="Difficulty"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Difficulty adjusts approximately every 2016 blocks (about 2 weeks). Step changes indicate network adjustments.</p>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Mempool Size (MB) - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mempoolHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={formatValue} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="Mempool Size"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Mempool size increases during business hours (9 AM - 6 PM) when transaction activity is highest.</p>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Transaction Fees (BTC) - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={feeHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => value.toFixed(5)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="Transaction Fee"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Transaction fees correlate with mempool congestion, rising during high-activity periods and falling during off-hours.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Transactions per Hour - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={txCountHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="Transactions"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>Transaction volume follows daily activity patterns, with peaks during business hours and lower activity overnight.</p>
          </div>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-4">BTC Sent per Hour - 24 Hours</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={btcSentHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={formatTimestamp} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['dataMin', 'dataMax']}
                  type="number"
                  scale="time"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tickFormatter={(value) => formatNumber(value)} 
                  stroke="#718096"
                  tick={{ fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  labelFormatter={formatDateTimestamp}
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
                  name="BTC Sent"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            <p>BTC volume follows similar patterns to transaction count, with occasional spikes from large transactions ("whale movements").</p>
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