import React, { useEffect, useState } from 'react';
import { Download, FileText, Database, Calendar, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/format';
import apiProxy from '../services/apiProxy'; // Keep apiProxy

interface GitHubAsset {
  id: number;
  name: string;
  content_type: string;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export const Datasets: React.FC = () => {
  const [assets, setAssets] = useState<GitHubAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        setLoading(true);
        const releaseData = await apiProxy.fetchReleaseData(201896251);

        const fetchedAssets: GitHubAsset[] = releaseData.map((asset: any) => ({
          id: asset.id,
          name: asset.name,
          content_type: asset.content_type,
          size: asset.size,
          download_count: asset.download_count,
          created_at: asset.created_at,
          updated_at: asset.updated_at,
          browser_download_url: asset.browser_download_url,
        }));

        setAssets(fetchedAssets);
        setError(null);
      } catch (err: any) {
        console.error('Error loading datasets:', err);
        setError(err.message || 'Failed to load dataset information');
      } finally {
        setLoading(false);
      }
    };

    loadDatasets();
  }, []);


  // ... (rest of your component: formatDate, getFileType, getFileDescription, JSX) ...
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                throw new Error('Invalid date');
            }
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Recently updated';
        }
    };

    const getFileType = (fileName: string, contentType: string): string => {
        if (fileName.endsWith('.gz') || contentType === 'application/gzip') {
            return 'GZIP';
        } else if (fileName.endsWith('.tsv.gz')) {
            return 'TSV (GZIP)';
        } else if (fileName.endsWith('.txt.gz')) {
            return 'TXT (GZIP)';
        } else {
            return contentType.split('/')[1]?.toUpperCase() || 'BINARY';
        }
    };

    const getFileDescription = (fileName: string): string => {
        if (fileName.includes('P2PKH')) {
            return 'Collection of Bitcoin P2PKH addresses (starting with "1") with their balances and transaction counts';
        } else if (fileName.includes('P2SH')) {
            return 'Collection of Bitcoin P2SH addresses (starting with "3") with their balances and transaction counts';
        } else if (fileName.includes('BECH32')) {
            return 'Collection of Bitcoin BECH32 addresses (starting with "bc1") with their balances and transaction counts';
        } else if (fileName.includes('Address')) {
            return 'Complete Bitcoin address database with balances, transaction counts, and last activity';
        } else if (fileName.includes('Addresses.tsv')) {
            return 'Tab-separated values file containing all Bitcoin addresses with detailed information';
        } else {
            return 'Bitcoin blockchain data file containing address information and balances';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400">Loading datasets...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-red-500 bg-red-500/10 px-6 py-4 rounded-lg border border-red-500/20 max-w-md text-center">
                    <p className="mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-[#0E141B] rounded-lg p-8 border border-gray-800">
                <div className="flex items-center gap-4 mb-8">
                    <Database className="w-8 h-8 text-orange-500" />
                    <div>
                        <h1 className="text-2xl font-bold mb-2">Bitcoin Datasets</h1>
                        <p className="text-gray-400">
                            Download comprehensive Bitcoin blockchain data for research and analysis
                        </p>
                    </div>
                </div>

                {/* Alert section removed as fallback is removed */}

                <div className="grid gap-6 md:grid-cols-2">
                    {assets.map((asset) => (
                        <div
                            key={asset.id}
                            className="bg-[#0B1017] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors group"
                        >
                            <div className="flex flex-col h-full">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold mb-2 text-gray-100">
                                        {asset.name.replace(/_/g, ' ').replace('.txt.gz', '').replace('.tsv.gz', '')}
                                    </h3>
                                    <p className="text-gray-400 text-sm mb-4">
                                        {getFileDescription(asset.name)}
                                    </p>

                                    <div className="bg-green-900/20 rounded-lg p-3 mb-4 border border-green-800/30">
                                        <div className="flex items-center gap-2 text-green-400 text-sm">
                                            <Calendar className="w-4 h-4" />
                                            <span>Updated: {formatDate(asset.updated_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <FileText className="w-4 h-4" />
                                            <span>{getFileType(asset.name, asset.content_type)}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{formatBytes(asset.size)}</span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-800">
                                    <a
                                        href={asset.browser_download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 w-full p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-orange-500 hover:bg-gray-700 transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                        <span>Download</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-[#0E141B] rounded-lg p-8 border border-gray-800">
                <h2 className="text-xl font-bold mb-4">Usage Guidelines</h2>
                <div className="space-y-4 text-gray-300">
                    <p>
                        These datasets are provided for research and analysis purposes. Please note:
                    </p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li>Files are compressed in GZIP format to reduce download size</li>
                        <li>Datasets are updated regularly to maintain accuracy</li>
                        <li>Consider using a download manager for large files</li>
                        <li>Check file integrity after download using provided checksums</li>
                        <li>Data is sourced from the Bitcoin blockchain and updated automatically</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};