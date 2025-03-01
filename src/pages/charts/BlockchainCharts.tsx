import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { Container, PageHeader } from '../../components/ui';
import { ChartCard } from '../../components/charts/ChartCard';
import { ChartCategorySelector } from '../../components/charts/ChartCategorySelector';
import { ChartTimeRangeSelector } from '../../components/charts/ChartTimeRangeSelector';
import { ChartInfo, ChartResponse, ChartTimeRange } from '../../types';
import { getChartsByCategory, fetchChartData } from '../../utils/chartsApi';

export const BlockchainCharts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [charts, setCharts] = useState<ChartInfo[]>([]);
  const [chartData, setChartData] = useState<Record<string, ChartResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<string | null>(searchParams.get('chart'));
  const [timeRange, setTimeRange] = useState<ChartTimeRange>({ label: '1Y', days: 365 });

  useEffect(() => {
    const loadCharts = async () => {
      setIsLoading(true);
      
      // Get all blockchain charts
      const blockchainCharts = getChartsByCategory('blockchain');
      setCharts(blockchainCharts);
      
      // If a chart is selected in the URL, use that, otherwise use the first chart
      const chartId = selectedChart || blockchainCharts[0]?.id;
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
    
    loadCharts();
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
        title="Blockchain Charts" 
        description="Explore Bitcoin blockchain data and trends"
        icon={<Activity className="w-8 h-8" />}
      />
      
      <ChartCategorySelector activeCategory="blockchain" className="mb-8" />
      
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