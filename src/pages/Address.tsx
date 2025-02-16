import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAddressInfo, formatBitcoinValue } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { AddressResponse } from '../types';
import { 
  Loader2, 
  ArrowLeft, 
  Copy, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertCircle,
  History,
  ArrowRight,
  Calendar,
  DollarSign
} from 'lucide-react';

export const Address: React.FC = () => {
  const { address } = useParams<{ address: string }>();
  const [data, setData] = useState<AddressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!address) {
        setError('No address provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchAddressInfo(address);
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(errorMessage);
        console.error('Error loading address data:', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [address]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-lg p-8 bg-[#0E141B] dark:bg-[#0E141B] rounded-lg shadow-lg border border-gray-800">
          <p className="text-red-500 mb-6">{error}</p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">Address Details</h1>
        </div>
      </div>

      <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800 mb-6">
          <Wallet className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <span 
            className="font-mono text-orange-500 text-sm break-all"
            style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {data.address}
          </span>
          <button 
            onClick={() => copyToClipboard(data.address)}
            className="p-1 hover:bg-gray-800 rounded ml-auto flex-shrink-0"
            title="Copy address"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Wallet className="w-4 h-4" />
              <span>Current Balance</span>
            </div>
            <div className="text-xl font-semibold text-green-400">
              {formatBitcoinValue(data.balance)} BTC
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <ArrowUpRight className="w-4 h-4" />
              <span>Total Sent</span>
            </div>
            <div className="text-xl font-semibold text-orange-400">
              {formatBitcoinValue(data.totalSent)} BTC
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <ArrowDownRight className="w-4 h-4" />
              <span>Total Received</span>
            </div>
            <div className="text-xl font-semibold text-green-400">
              {formatBitcoinValue(data.totalReceived)} BTC
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Unconfirmed Balance</span>
            </div>
            <div className="text-xl font-semibold text-yellow-400">
              {formatBitcoinValue(data.unconfirmedBalance)} BTC
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span>Unconfirmed Transactions</span>
            </div>
            <div className="text-xl font-semibold text-yellow-400">
              {data.unconfirmedTxs}
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <History className="w-4 h-4" />
              <span>Total Transactions</span>
            </div>
            <div className="text-xl font-semibold">
              {data.txs}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Transaction History
          <span className="text-sm text-gray-400">({data.txids.length} transactions)</span>
        </h2>
        <div className="space-y-3">
          {data.txids.map((txid, index) => (
            <Link
              key={txid}
              to={`/tx/${txid}`}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#0B1017] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <span 
                    className="font-mono text-sm text-orange-500 group-hover:text-orange-400 break-all"
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {txid}
                  </span>
                  <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 sm:ml-auto">
                <div className="flex items-center gap-2 bg-[#0E141B] px-3 py-1.5 rounded-lg border border-green-800/30">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400 text-xs whitespace-nowrap">
                    {formatBitcoinValue(data.values[index])} BTC
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-[#0E141B] px-3 py-1.5 rounded-lg border border-blue-800/30">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-400 text-xs whitespace-nowrap">
                    {new Date(data.timestamps[index] * 1000).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300">
                  <span>Details</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
