import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, TrendingUp, Zap, Activity } from 'lucide-react';
import { ChartCategory } from '../../types';

interface ChartCategorySelectorProps {
  activeCategory?: ChartCategory;
  className?: string;
}

export const ChartCategorySelector: React.FC<ChartCategorySelectorProps> = ({
  activeCategory,
  className = ''
}) => {
  const categories = [
    { id: 'market', label: 'Market', icon: <TrendingUp className="w-4 h-4" />, path: '/charts/market' },
    { id: 'blockchain', label: 'Blockchain', icon: <Activity className="w-4 h-4" />, path: '/charts/blockchain' },
    { id: 'mining', label: 'Mining', icon: <Zap className="w-4 h-4" />, path: '/charts/mining' },
    { id: 'network', label: 'Network', icon: <BarChart2 className="w-4 h-4" />, path: '/charts/network' }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {categories.map((category) => (
        <Link
          key={category.id}
          to={category.path}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeCategory === category.id
              ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-transparent'
          }`}
        >
          {category.icon}
          <span>{category.label}</span>
        </Link>
      ))}
    </div>
  );
};