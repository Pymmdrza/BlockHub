import React from 'react';
import { ChartTimeRange } from '../../types';

interface ChartTimeRangeSelectorProps {
  selectedRange: ChartTimeRange;
  onRangeChange: (range: ChartTimeRange) => void;
  className?: string;
}

export const ChartTimeRangeSelector: React.FC<ChartTimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  className = ''
}) => {
  const timeRanges: ChartTimeRange[] = [
    { label: '1D', days: 1 },
    { label: '1W', days: 7 },
    { label: '1M', days: 30 },
    { label: '3M', days: 90 },
    { label: '1Y', days: 365 },
    { label: 'All', days: 0 }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {timeRanges.map((range) => (
        <button
          key={range.label}
          onClick={() => onRangeChange(range)}
          className={`px-3 py-1 text-sm rounded-md transition-colors ${
            selectedRange.label === range.label
              ? 'bg-orange-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};