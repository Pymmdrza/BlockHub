import React from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartInfo } from '../../types';
import { Skeleton } from '../ui/Skeleton';

interface ChartCardProps {
  chartInfo: ChartInfo;
  data?: Array<{ x: number; y: number }>;
  isLoading?: boolean;
  showFullChart?: boolean;
  height?: number;
  linkTo?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  chartInfo,
  data = [],
  isLoading = false,
  showFullChart = false,
  height = 200,
  linkTo
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatValue = (value: number) => {
    // Format based on the unit
    if (chartInfo.unit === 'USD') {
      // For large USD values (billions or trillions)
      if (value >= 1000000000000) {
        return `$${(value / 1000000000000).toFixed(2)}T`;
      }
      if (value >= 1000000000) {
        return `$${(value / 1000000000).toFixed(2)}B`;
      }
      if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(2)}M`;
      }
      if (value >= 1000) {
        return `$${(value / 1000).toFixed(2)}K`;
      }
      return `$${value.toFixed(2)}`;
    }
    
    // For large counts
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)}K`;
    }
    
    // Default formatting
    return value.toFixed(2);
  };

  const getLatestValue = () => {
    if (data.length === 0) return 'N/A';
    const latestValue = data[data.length - 1].y;
    return formatValue(latestValue);
  };

  const getValueChange = () => {
    if (data.length < 2) return { value: 0, isPositive: true };
    
    const latestValue = data[data.length - 1].y;
    const previousValue = data[0].y;
    const change = ((latestValue - previousValue) / previousValue) * 100;
    
    return {
      value: Math.abs(change),
      isPositive: change >= 0
    };
  };

  const change = getValueChange();

  const renderContent = () => (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{chartInfo.name}</h3>
        <p className="text-sm text-gray-400 mt-1">{chartInfo.description}</p>
      </div>
      
      {isLoading ? (
        <div className="h-[200px] flex items-center justify-center">
          <Skeleton height={height} width="100%" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-2xl font-bold">{getLatestValue()}</div>
            <div className={`flex items-center text-sm ${change.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              <span>{change.isPositive ? '↑' : '↓'}</span>
              <span>{change.value.toFixed(2)}%</span>
            </div>
          </div>
          
          <div style={{ height: `${height}px` }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                {showFullChart && <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />}
                {showFullChart && (
                  <XAxis 
                    dataKey="x" 
                    tickFormatter={formatTimestamp} 
                    stroke="#718096"
                    tick={{ fontSize: 12 }}
                  />
                )}
                {showFullChart && (
                  <YAxis 
                    tickFormatter={formatValue} 
                    stroke="#718096"
                    tick={{ fontSize: 12 }}
                  />
                )}
                {showFullChart && (
                  <Tooltip 
                    labelFormatter={(label) => new Date(label * 1000).toLocaleString()}
                    formatter={(value: any) => [formatValue(value), chartInfo.name]}
                    contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                    itemStyle={{ color: '#F7FAFC' }}
                    labelStyle={{ color: '#A0AEC0' }}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke={chartInfo.color} 
                  strokeWidth={2}
                  dot={false}
                  activeDot={showFullChart ? { r: 6 } : false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block">
        <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors h-full">
          {renderContent()}
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800 h-full">
      {renderContent()}
    </div>
  );
};