import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '../ui/Skeleton';

interface PieChartCardProps {
  title: string;
  description?: string;
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  isLoading?: boolean;
  height?: number;
  valueFormatter?: (value: number) => string;
}

export const PieChartCard: React.FC<PieChartCardProps> = ({
  title,
  description,
  data,
  isLoading = false,
  height = 300,
  valueFormatter = (value) => `${value.toFixed(2)}%`
}) => {
  return (
    <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800 h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      
      {isLoading ? (
        <div className="h-[300px] flex items-center justify-center">
          <Skeleton height={height} width="100%" />
        </div>
      ) : (
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [valueFormatter(value), 'Share']}
                contentStyle={{ backgroundColor: '#1A202C', borderColor: '#2D3748' }}
                itemStyle={{ color: '#F7FAFC' }}
                labelStyle={{ color: '#A0AEC0' }}
              />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
                formatter={(value, entry, index) => (
                  <span style={{ color: '#A0AEC0' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};