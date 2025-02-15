import React, { useEffect, useState } from 'react';
import { Download, FileText, Database, Calendar } from 'lucide-react';

interface DatasetLink {
  type: string;
  link: string;
  format: string;
  size: string;
  description: string;
  updated: string;
}

interface ApiResponse {
  links: DatasetLink[];
}

export const Datasets: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDatasets = async () => {
      try {
        const response = await fetch('/dataset_links.json');
        if (!response.ok) {
          throw new Error('Failed to load dataset information');
        }
        const data: ApiResponse = await response.json();
        setDatasets(data.links);
        setError(null);
      } catch (err) {
        setError('Failed to load dataset information');
        setDatasets([]);
      } finally {
        setLoading(false);
      }
    };

    loadDatasets();
  }, []);

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

        <div className="grid gap-6 md:grid-cols-2">
          {datasets.map((dataset, index) => (
            <div
              key={`${dataset.type}-${index}`}
              className="bg-[#0B1017] rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-colors group"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 text-gray-100">
                    {dataset.type}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {dataset.description}
                  </p>
                  
                  <div className="bg-green-900/20 rounded-lg p-3 mb-4 border border-green-800/30">
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Updated: {formatDate(dataset.updated)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{dataset.format}</span>
                    </div>
                    <span>•</span>
                    <span>{dataset.size}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-800">
                  <a
                    href={dataset.link}
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
          </ul>
        </div>
      </div>
    </div>
  );
};