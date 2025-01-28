import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { BitcoinPrice as BitcoinPriceType } from '../types';

interface BitcoinPriceProps {
  price: BitcoinPriceType;
}

export const BitcoinPrice: React.FC<BitcoinPriceProps> = ({ price }) => {
  const isPositive = price.USD.change_24h >= 0;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Bitcoin Price
      </h2>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            ${price.USD.last.toLocaleString()}
          </p>
          <div className="flex items-center mt-2">
            <span className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {Math.abs(price.USD.change_24h).toFixed(2)}%
            </span>
            <span className="text-gray-500 dark:text-gray-400 ml-2">24h</span>
          </div>
        </div>
      </div>
    </div>
  );
};