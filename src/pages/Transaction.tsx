import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchTransactionInfo, formatBitcoinValue } from '../utils/api';
import { truncateAddress } from '../utils/format';
import { TransactionResponse } from '../types';
import { 
  Loader2, 
  ArrowLeft, 
  Copy, 
  ArrowRight,
  Clock,
  DollarSign,
  Hash,
  Layers,
  Scale,
  HardDrive,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const Transaction: React.FC = () => {
  const { txid } = useParams<{ txid: string }>();
  const [data, setData] = useState<TransactionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!txid) {
        setError('No transaction ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await fetchTransactionInfo(txid);
        
        if (!result || !result.txid) {
          throw new Error('Invalid transaction data received');
        }
        
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load transaction information';
        console.error('Error loading transaction data:', err);
        setError(errorMessage);
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
          <p className="text-red-500 mb-6">{error || 'Transaction data not available'}</p>
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

  const confirmationStatus = data.confirmations > 0 ? (
    <div className="flex items-center gap-2 text-green-400">
      <CheckCircle2 className="w-5 h-5" />
      <span>Confirmed ({data.confirmations} confirmations)</span>
    </div>
  ) : (
    <div className="flex items-center gap-2 text-yellow-400">
      <AlertCircle className="w-5 h-5" />
      <span>Unconfirmed</span>
    </div>
  );

  // Check if we have valid input and output data
  const hasValidInputs = data.vin && data.vin.length > 0 && data.vin.some(input => input.addresses && input.addresses.length > 0);
  const hasValidOutputs = data.vout && data.vout.length > 0 && data.vout.some(output => output.addresses && output.addresses.length > 0);

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
        {confirmationStatus}
      </div>

      <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 p-4 bg-[#0B1017] rounded-lg border border-gray-800">
            <Hash className="w-5 h-5 text-orange-500" />
            <span 
              className="font-mono text-orange-500 text-sm break-all"
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {data.txid}
            </span>
            <button 
              onClick={() => copyToClipboard(data.txid)}
              className="p-1 hover:bg-gray-800 rounded ml-auto flex-shrink-0"
              title="Copy transaction ID"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span>Total Value</span>
              </div>
              <div className="text-xl font-semibold text-green-400">
                {formatBitcoinValue(data.value)} BTC
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Scale className="w-4 h-4" />
                <span>Network Fee</span>
              </div>
              <div className="text-xl font-semibold text-orange-400">
                {formatBitcoinValue(data.fees)} BTC
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Layers className="w-4 h-4" />
                <span>Confirmations</span>
              </div>
              <div className="text-xl font-semibold">
                {data.confirmations}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Block Height</span>
              </div>
              <div className="text-xl font-semibold">
                {data.blockHeight > 0 ? (
                  <Link to={`/block/${data.blockHeight}`} className="text-blue-400 hover:text-blue-300">
                    {data.blockHeight}
                  </Link>
                ) : (
                  'Unconfirmed'
                )}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Clock className="w-4 h-4" />
                <span>Timestamp</span>
              </div>
              <div className="text-xl font-semibold">
                {new Date(data.blockTime * 1000).toLocaleString()}
              </div>
            </div>

            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Size</span>
              </div>
              <div className="text-xl font-semibold">
                {(data.size || 0).toLocaleString()} bytes
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {hasValidInputs ? (
          <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-orange-500">Inputs</span>
              <span className="text-sm text-gray-400">({data.vin.length})</span>
            </h2>
            <div className="space-y-3">
              {data.vin.map((input, index) => (
                <div key={index} className="p-4 bg-[#0B1017] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {input.addresses && input.addresses.length > 0 ? (
                          input.addresses.map((addr) => (
                            <div key={addr} className="flex items-center gap-2">
                              <Link
                                to={`/address/${addr}`}
                                className="block text-orange-500 hover:text-orange-400 font-mono text-sm break-all flex-1"
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              >
                                {addr}
                              </Link>
                              <button 
                                onClick={() => copyToClipboard(addr)}
                                className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                                title="Copy address"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No address data available</span>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-sm font-medium text-green-400">
                          {formatBitcoinValue(input.value)} BTC
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-orange-500">Inputs</span>
            </h2>
            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <p className="text-gray-400 italic">No input data available for this transaction</p>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <div className="w-8 h-8 bg-[#0E141B] rounded-full flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-gray-500" />
          </div>
        </div>

        {hasValidOutputs ? (
          <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">Outputs</span>
              <span className="text-sm text-gray-400">({data.vout.length})</span>
            </h2>
            <div className="space-y-3">
              {data.vout.map((output, index) => (
                <div key={index} className="p-4 bg-[#0B1017] rounded-lg border border-gray-800 hover:border-gray-700 transition-colors">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {output.addresses && output.addresses.length > 0 ? (
                          output.addresses.map((addr) => (
                            <div key={addr} className="flex items-center gap-2">
                              <Link
                                to={`/address/${addr}`}
                                className="block text-green-500 hover:text-green-400 font-mono text-sm break-all flex-1"
                                style={{
                                  wordBreak: 'break-word',
                                  overflowWrap: 'break-word'
                                }}
                              >
                                {addr}
                              </Link>
                              <button 
                                onClick={() => copyToClipboard(addr)}
                                className="p-1 hover:bg-gray-800 rounded flex-shrink-0"
                                title="Copy address"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No address data available</span>
                        )}
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <div className="text-sm font-medium text-green-400">
                          {formatBitcoinValue(output.value)} BTC
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#0E141B] dark:bg-[#0E141B] rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="text-green-500">Outputs</span>
            </h2>
            <div className="p-4 bg-[#0B1017] rounded-lg border border-gray-800">
              <p className="text-gray-400 italic">No output data available for this transaction</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};