import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, TrendingUp, BarChart2, Zap, Activity, ArrowRight } from 'lucide-react';
import { Container, PageHeader, Spinner } from '../../components/ui';
import { ChartCard } from '../../components/charts/ChartCard';
import { ChartCategorySelector } from '../../components/charts/ChartCategorySelector';
import { ChartInfo, ChartResponse } from '../../types';
import { getChartsByCategory, fetchChartData } from '../../utils/chartsApi';

export const ChartExplorer: React.FC = () => {
  const [marketCharts, setMarketCharts] = useState<ChartInfo[]>([]);
  const [blockchainCharts, setBlockchainCharts] = useState<ChartInfo[]>([]);
  const [miningCharts, setMiningCharts] = useState<ChartInfo[]>([]);
  const [networkCharts, setNetworkCharts] = useState<ChartInfo[]>([]);
  
  const [marketData, setMarketData] = useState<Record<string, ChartResponse>>({});
  const [blockchainData, setBlockchainData] = useState<Record<string, ChartResponse>>({});
  const [miningData, setMiningData] = useState<Record<string, ChartResponse>>({});
  const [networkData, setNetworkData] = useState<Record<string, ChartResponse>>({});
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      
      // Get charts by category
      const market = getChartsByCategory('market').slice(0, 2);
      const blockchain = getChartsByCategory('blockchain').slice(0, 2);
      const mining = getChartsByCategory('mining').slice(0, 2);
      const network = getChartsByCategory('network').slice(0, 2);
      
      setMarketCharts(market);
      setBlockchainCharts(blockchain);
      setMiningCharts(mining);
      setNetworkCharts(network);
      
      // Fetch data for each chart
      const fetchChartDataWithTimeout = async (chartId: string) => {
        try {
          const data = await fetchChartData(chartId, '1month');
          return { id: chartId, data };
        } catch (error) {
          console.error(`Error fetching data for chart ${chartId}:`, error);
          // Return mock data
          return { 
            id: chartId, 
            data: {
              status: 'ok',
              name: 'Mock Data',
              unit: '',
              period: 'day',
              description: 'Mock data for chart',
              values: Array(30).fill(0).map((_, i) => ({
                x: Math.floor(Date.now() / 1000) - (30 - i) * 86400,
                y: 100 + Math.random() * 50
              }))
            } 
          };
        }
      };
      
      try {
        // Fetch data for each category in parallel
        const [marketResults, blockchainResults, miningResults, networkResults] = await Promise.all([
          Promise.all(market.map(chart => fetchChartDataWithTimeout(chart.id))),
          Promise.all(blockchain.map(chart => fetchChartDataWithTimeout(chart.id))),
          Promise.all(mining.map(chart => fetchChartDataWithTimeout(chart.id))),
          Promise.all(network.map(chart => fetchChartDataWithTimeout(chart.id)))
        ]);
        
        // Convert results to record objects
        const marketDataRecord: Record<string, ChartResponse> = {};
        marketResults.forEach(result => {
          marketDataRecord[result.id] = result.data;
        });
        
        const blockchainDataRecord: Record<string, ChartResponse> = {};
        blockchainResults.forEach(result => {
          blockchainDataRecord[result.id] = result.data;
        });
        
        const miningDataRecord: Record<string, ChartResponse> = {};
        miningResults.forEach(result => {
          miningDataRecord[result.id] = result.data;
        });
        
        const networkDataRecord: Record<string, ChartResponse> = {};
        networkResults.forEach(result => {
          networkDataRecord[result.id] = result.data;
        });
        
        setMarketData(marketDataRecord);
        setBlockchainData(blockchainDataRecord);
        setMiningData(miningDataRecord);
        setNetworkData(networkDataRecord);
      } catch (error) {
        console.error('Error loading chart data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCharts();
  }, []);

  return (
    <Container>
      <PageHeader 
        title="Bitcoin Charts" 
        description="Explore historical Bitcoin data and trends"
        icon={<LineChart className="w-8 h-8" />}
      />
      
      <ChartCategorySelector className="mb-8" />
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <Spinner />
            <p className="text-gray-400">Loading charts...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Market Charts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold">Market</h2>
              </div>
              <Link 
                to="/charts/market" 
                className="text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {marketCharts.map(chart => (
                <ChartCard 
                  key={chart.id}
                  chartInfo={chart}
                  data={marketData[chart.id]?.values}
                  isLoading={false}
                  linkTo={`/charts/market?chart=${chart.id}`}
                />
              ))}
            </div>
          </div>
          
          {/* Blockchain Charts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-bold">Blockchain</h2>
              </div>
              <Link 
                to="/charts/blockchain" 
                className="text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blockchainCharts.map(chart => (
                <ChartCard 
                  key={chart.id}
                  chartInfo={chart}
                  data={blockchainData[chart.id]?.values}
                  isLoading={false}
                  linkTo={`/charts/blockchain?chart=${chart.id}`}
                />
              ))}
            </div>
          </div>
          
          {/* Mining Charts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-bold">Mining</h2>
              </div>
              <Link 
                to="/charts/mining" 
                className="text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {miningCharts.map(chart => (
                <ChartCard 
                  key={chart.id}
                  chartInfo={chart}
                  data={miningData[chart.id]?.values}
                  isLoading={false}
                  linkTo={`/charts/mining?chart=${chart.id}`}
                />
              ))}
            </div>
          </div>
          
          {/* Network Charts */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold">Network</h2>
              </div>
              <Link 
                to="/charts/network" 
                className="text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {networkCharts.map(chart => (
                <ChartCard 
                  key={chart.id}
                  chartInfo={chart}
                  data={networkData[chart.id]?.values}
                  isLoading={false}
                  linkTo={`/charts/network?chart=${chart.id}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};