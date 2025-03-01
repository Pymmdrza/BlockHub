import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { Container, PageHeader } from '../../components/ui';
import { ChartCard } from '../../components/charts/ChartCard';
import { ChartCategorySelector } from '../../components/charts/ChartCategorySelector';
import { ChartTimeRangeSelector } from '../../components/charts/ChartTimeRangeSelector';
import { PieChartCard } from '../../components/charts/PieChartCard';
import { ChartInfo, ChartResponse, ChartTimeRange, MiningPoolDistribution } from '../../types';
import { getChartsByCategory, fetchChartData, getMiningPoolDistribution } from '../../utils/chartsApi';

export const MiningCharts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartResponse>>({});
  const [poolDistribution, setPoolDistribution] = useState<MiningPoolDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPoolsLoading, setIsPoolsLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<string | null>(searchParams.get('chart'));
  const [timeRange, setTimeRange] = useState<ChartTimeRange>({ label: '1Y', days: 365 });

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      
      // Get all mining charts
      const miningCharts = getChartsByCategory('mining');
      setCharts(miningCharts);
      
      // If a chart is selected in the URL, use that, otherwise use the first chart
      const chartId = selectedChart || miningCharts[0]?.id;
      if (chartId) {
        setSelectedChart(chartId);
        
        // Convert time range to timespan parameter
        const timespan = timeRangeToTimespan(timeRange);
        
        try {
          // Fetch data for the selected chart
          const data = await fetchChartData(chartId, timespan);
          setChartData({ [chartId]: data });
        } catch (error) {
          console.error('Error loading chart data:', error);
        }
      }
      
      setIsLoading(false);
    };
    
    const loadPoolDistribution = async () => {
      setIsPoolsLoading(true);
      try {
        const pools = await getMiningPoolDistribution();
        setPoolDistribution(pools);
      } catch (error) {
        console.error('Error loading mining pool distribution:', error);
      } finally {
        setIsPoolsLoading(false);
      }
    };
    
    loadCharts();
    loadPoolDistribution();
  }, [selectedChart, timeRange]);

  // Convert time range to timespan parameter for the API
  const timeRangeToTimespan = (range: ChartTimeRange): string => {
    if (range.days === 0) return 'all';
    if (range.days >= 365) return `${Math.floor(range.days / 365)}years`;
    if (range.days >= 30) return `${Math.floor(range.days / 30)}months`;
    if (range.days >= 7) return `${Math.floor(range.days / 7)}weeks`;
    return `${range.days}days`;
  };

  // Handle chart selection
  const handleChartSelect = (chartId: string) => {
    setSelectedChart(chartId);
    setSearchParams({ chart: chartId });
  };

  // Handle time range change
  const handleTimeRangeChange = (range: ChartTimeRange) => {
    setTimeRange(range);
  };

  // Get the selected chart info
  const selectedChartInfo = charts.find(chart => chart.id === selectedChart) || charts[0];

  return (
    <Container>
      <PageHeader 
        title="Mining Charts" 
        description="Explore Bitcoin mining data and trends"
        icon={<Zap className="w-8 h-8" />}
      />
      
      <ChartCategorySelector activeCategory="mining" className="mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#0E141B] rounded-lg p-4 border border-gray-800">
            <h3 className="text-lg font-semibold mb-4">Available Charts</h3>
            <div className="space-y-2">
              {charts.map(chart => (
                <button
                  key={chart.id}
                  onClick={() => handleChartSelect(chart.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedChart === chart.id
                      ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  {chart.name}
                </button>
              ))}
            </div>
          </div>
          
          <PieChartCard 
            title="Mining Pool Distribution"
            description="Share of blocks mined by mining pools in the last 4 days"
            data={poolDistribution}
            isLoading={isPoolsLoading}
            height={300}
          />
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-[#0E141B] rounded-lg border border-gray-800 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold">{selectedChartInfo?.name}</h2>
              <ChartTimeRangeSelector 
                selectedRange={timeRange}
                onRangeChange={handleTimeRangeChange}
              />
            </div>
            
            {selectedChartInfo && (
              <ChartCard 
                chartInfo={selectedChartInfo}
                data={chartData[selectedChartInfo.id]?.values}
                isLoading={isLoading}
                showFullChart
                height={400}
              />
            )}
            
            <div className="mt-6 text-sm text-gray-400">
              <p>{selectedChartInfo?.description}</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};