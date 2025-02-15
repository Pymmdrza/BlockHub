import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Activity, Database, Info, Github } from 'lucide-react';

export const MainNav: React.FC = () => {
  const navItems = [
    { to: '/', icon: <Home className="w-4 h-4" />, label: 'Home' },
    { to: '/live', icon: <Activity className="w-4 h-4" />, label: 'Live Transactions' },
    { to: '/datasets', icon: <Database className="w-4 h-4" />, label: 'Datasets Dump' },
    { to: '/about', icon: <Info className="w-4 h-4" />, label: 'About' },
  ];

  return (
    <div className="flex items-center space-x-1">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-orange-500/10 text-orange-500'
                : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
            }`
          }
        >
          <span className="flex items-center gap-2">
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </span>
        </NavLink>
      ))}
      <a
        href="https://github.com/Pymmdrza/BlockHub"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-gray-800/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Github className="w-4 h-4" />
          <span className="hidden sm:inline">GitHub</span>
        </span>
      </a>
    </div>
  );
};