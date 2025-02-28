import React from 'react';
import { Skeleton, SkeletonText } from './Skeleton';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
  isLoading?: boolean;
  chartData?: Array<{ timestamp: number; value: number }>;
  chartColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className = '',
  onClick,
  isLoading = false,
  chartData,
  chartColor = '#ED8936'
}) => {
  if (isLoading) {
    return (
      <div className={`stat-card ${onClick ? 'cursor-pointer hover:border-gray-700' : ''} ${className}`}>
        <div className="stat-title">
          {icon}
          <span>{title}</span>
        </div>
        <div className="h-7 mt-1 mb-2">
          <Skeleton height="1.75rem" width="80%" />
        </div>
        {trend && (
          <div className="mt-2">
            <Skeleton height="1rem" width="40%" />
          </div>
        )}
        {description && (
          <div className="mt-1">
            <Skeleton height="0.75rem" width="60%" />
          </div>
        )}
        {chartData && (
          <div className="h-12 mt-3">
            <Skeleton height="100%" width="100%" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`stat-card ${onClick ? 'cursor-pointer hover:border-gray-700' : ''} ${className}`}
      onClick={onClick}
    >
      <div className="stat-title">
        {icon}
        <span>{title}</span>
      </div>
      <div className="stat-value">
        {value}
      </div>
      {trend && (
        <div className={`flex items-center mt-2 text-sm ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
          <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(2)}%</span>
        </div>
      )}
      {description && (
        <div className="stat-desc">
          {description}
        </div>
      )}
      {chartData && chartData.length > 0 && (
        <div className="h-12 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartColor} 
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};