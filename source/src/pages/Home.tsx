import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SearchBar } from '../components/SearchBar';
import { BitcoinPrice } from '../components/BitcoinPrice';
import { Bitcoin, Activity } from 'lucide-react';
import { fetchBitcoinPrice } from '../utils/api';
import { BitcoinPrice as BitcoinPriceType } from '../types';

export const Home: React.FC = () => {
  const [price, setPrice] = useState<BitcoinPriceType | null>(null);

  useEffect(() => {
    const loadPrice = async () => {
      try {
        const data = await fetchBitcoinPrice();
        setPrice(data);
      } catch (error) {
        console.error('Error loading Bitcoin price:', error);
      }
    };

    loadPrice();
    const interval = setInterval(loadPrice, 6000); // Update price every 60 sec

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1017]">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {price && (
            <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <Bitcoin className="w-6 h-6 text-orange-500" />
                <h2 className="text-xl font-bold text-white">Bitcoin Price</h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-white">
                      ${price.USD.last.toLocaleString()}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={`flex items-center ${price.USD.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {Math.abs(price.USD.change_24h).toFixed(2)}%
                      </span>
                      <span className="text-gray-400 ml-2">24h Change</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Link 
            to="/live" 
            className="bg-[#0E141B] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-6 h-6 text-blue-500 group-hover:text-blue-400" />
              <h2 className="text-xl font-bold text-white">Live Transactions</h2>
            </div>
            <p className="text-gray-400">
              Watch Bitcoin transactions happening in real-time on the network
            </p>
          </Link>
        </div>

        <div className="bg-[#0E141B] rounded-lg p-8 border border-gray-800">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-300">
              Bitcoin Explorer
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Search for Bitcoin addresses and transactions to explore the blockchain
            </p>
            <SearchBar />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Real-Time Data</h3>
            <p className="text-gray-400">
              Get instant access to the latest Bitcoin blockchain data and transactions
            </p>
          </div>

          <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Address Details</h3>
            <p className="text-gray-400">
              View comprehensive information about any Bitcoin address including balance and transaction history
            </p>
          </div>

          <div className="bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-2">Transaction Tracking</h3>
            <p className="text-gray-400">
              Track and analyze Bitcoin transactions with detailed insights and visualizations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};