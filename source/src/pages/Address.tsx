import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAddressInfo, formatBitcoinValue } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { AddressResponse } from '../types';
import { Loader2, ArrowLeft, Copy } from 'lucide-react';

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
        <div className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800">
          <span className="font-mono text-orange-500 text-sm truncate max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px]" title={data.address}>
            {truncateAddress(data.address, 48)}
          </span>
          <button 
            onClick={() => copyToClipboard(data.address)}
            className="p-1 hover:bg-gray-800 rounded"
            title="Copy address"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Balance</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.balance)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Total Received</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.totalReceived)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Total Sent</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.totalSent)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Unconfirmed Balance</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.unconfirmedBalance)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Unconfirmed Transactions</div>
            <div className="text-xl font-semibold">{data.unconfirmedTxs}</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Total Transactions</div>
            <div className="text-xl font-semibold">{data.txs}</div>
          </div>
        </div>
      </div>

      <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-3">
          {data.txids.map((txid) => (
            <Link
              key={txid}
              to={`/tx/${txid}`}
              className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              <span className="font-mono text-sm text-gray-300/90 truncate flex-1" title={txid}>
                {truncateAddress(txid, 48)}
              </span>
              <Copy className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};