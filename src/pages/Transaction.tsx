import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTransactionInfo, formatBitcoinValue } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { TransactionResponse } from '../types';
import { Loader2, ArrowLeft, Copy, ArrowRight } from 'lucide-react';

export const Transaction: React.FC = () => {
  const { txid } = useParams<{ txid: string }>();
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!txid) throw new Error('No transaction ID provided');
        const result = await fetchTransactionInfo(txid);
        setData(result);
      } catch (err) {
        setError('Failed to load transaction information');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [txid]);

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
          <h1 className="text-2xl font-bold">Transaction Details</h1>
        </div>
      </div>

      <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <div className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800">
          <span className="font-mono text-orange-500 text-sm truncate max-w-[300px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px]" title={data.txid}>
            {truncateAddress(data.txid, 48)}
          </span>
          <button 
            onClick={() => copyToClipboard(data.txid)}
            className="p-1 hover:bg-gray-800 rounded"
            title="Copy transaction ID"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Value</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.value)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Fee</div>
            <div className="text-xl font-semibold">{formatBitcoinValue(data.fees)} BTC</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Confirmations</div>
            <div className="text-xl font-semibold">{data.confirmations}</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Block Height</div>
            <div className="text-xl font-semibold">{data.blockHeight}</div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Time</div>
            <div className="text-xl font-semibold">
              {new Date(data.blockTime * 1000).toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <div className="text-sm text-gray-400 mb-1">Size</div>
            <div className="text-xl font-semibold">{data.size} bytes</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Inputs</h2>
          <div className="space-y-3">
            {data.vin.map((input, index) => (
              <div key={index} className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {input.addresses.map((addr) => (
                      <Link
                        key={addr}
                        to={`/address/${addr}`}
                        className="block text-orange-500 hover:text-orange-400 font-mono text-sm truncate"
                        title={addr}
                      >
                        {truncateAddress(addr, 32)}
                      </Link>
                    ))}
                  </div>
                  <div className="text-left sm:text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-400">{formatBitcoinValue(input.value)} BTC</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-8 h-8 bg-[#0E141B] rounded-full flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Outputs</h2>
          <div className="space-y-3">
            {data.vout.map((output, index) => (
              <div key={index} className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {output.addresses.map((addr) => (
                      <Link
                        key={addr}
                        to={`/address/${addr}`}
                        className="block text-green-500 hover:text-green-400 font-mono text-sm truncate"
                        title={addr}
                      >
                        {truncateAddress(addr, 32)}
                      </Link>
                    ))}
                  </div>
                  <div className="text-left sm:text-right whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-400">{formatBitcoinValue(output.value)} BTC</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};