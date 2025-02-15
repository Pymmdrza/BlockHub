import React from 'react';
import { Shield, Github, Twitter } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-[#0E141B] rounded-lg p-8 border border-gray-800">
        <div className="flex items-center gap-4 mb-6">
          <Shield className="w-12 h-12 text-orange-500" />
          <h1 className="text-3xl font-bold">About BlockHub</h1>
        </div>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed">
            BlockHub is a modern, real-time Bitcoin blockchain explorer designed to provide comprehensive
            insights into Bitcoin transactions, addresses, and network activity. Our platform offers a
            user-friendly interface for exploring the Bitcoin blockchain, with features including live
            transaction monitoring, detailed address analysis, and access to extensive blockchain datasets.
          </p>

          <h2 className="text-xl font-semibold mt-8 mb-4">Key Features</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• Real-time transaction monitoring with detailed insights</li>
            <li>• Comprehensive address tracking and analysis</li>
            <li>• Access to extensive Bitcoin blockchain datasets</li>
            <li>• User-friendly interface with dark mode optimization</li>
            <li>• Mobile-responsive design for on-the-go access</li>
          </ul>

          <h2 className="text-xl font-semibold mt-8 mb-4">Technology Stack</h2>
          <ul className="space-y-3 text-gray-300">
            <li>• React with TypeScript for robust frontend development</li>
            <li>• Tailwind CSS for modern, responsive styling</li>
            <li>• Real-time data updates using WebSocket connections</li>
            <li>• Optimized performance with efficient data handling</li>
          </ul>
        </div>
      </div>

      <div className="bg-[#0E141B] rounded-lg p-8 border border-gray-800">
        <h2 className="text-xl font-semibold mb-6">Connect With Us</h2>
        <div className="flex flex-wrap gap-4">
          <a
            href="https://github.com/Pymmdrza/BlockHub"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Github className="w-5 h-5" />
            <span>GitHub</span>
          </a>
          <a
            href="https://twitter.com/MPymmdrza"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Twitter className="w-5 h-5" />
            <span>Twitter</span>
          </a>
        </div>
      </div>
    </div>
  );
};