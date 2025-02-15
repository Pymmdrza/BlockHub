import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Address } from './pages/Address';
import { Transaction } from './pages/Transaction';
import { LiveTransactions } from './pages/LiveTransactions';
import { About } from './pages/About';
import { Datasets } from './pages/Datasets';
import { MainNav } from './components/MainNav';
import { Shield } from 'lucide-react';
import { isBitcoinAddress, isTransactionId } from './utils/validation';

function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    if (trimmedQuery.length < 64) {
      if (isBitcoinAddress(trimmedQuery)) {
        navigate(`/address/${trimmedQuery}`);
      }
    } else {
      if (isTransactionId(trimmedQuery)) {
        navigate(`/tx/${trimmedQuery}`);
      }
    }
    
    setQuery('');
  };

  return (
    <form onSubmit={handleSearch} className="flex-1 max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address or transaction ID..."
          className="w-full px-4 py-2 bg-[#0B1017] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm text-gray-200 placeholder-gray-500"
        />
      </div>
    </form>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0B1017] text-gray-100 flex flex-col">
        <nav className="sticky top-0 z-50 bg-[#0E141B] shadow-md border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-4">
                <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
                  <Shield className="w-6 h-6 text-orange-500" />
                  <span className="text-xl font-bold">BlockHub</span>
                </Link>
                
                <HeaderSearch />
              </div>
              
              <div className="flex items-center justify-between">
                <MainNav />
              </div>
            </div>
          </div>
        </nav>

        <main className="container mx-auto py-8 px-4 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/address/:address" element={<Address />} />
            <Route path="/tx/:txid" element={<Transaction />} />
            <Route path="/live" element={<LiveTransactions />} />
            <Route path="/datasets" element={<Datasets />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="bg-[#0E141B] border-t border-gray-800 py-4">
          <div className="container mx-auto px-4 text-center">
            <p className="text-xs text-gray-500">
              Developed by{' '}
              <a 
                href="https://github.com/Pymmdrza" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-400 hover:text-orange-500 transition-colors"
              >
                Pymmdrza
              </a>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
