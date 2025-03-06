export const truncateAddress = (address: string, maxLength: number = 24): string => {
  if (!address) return '';
  if (address.length <= maxLength) return address;
  return `${address.slice(0, maxLength)}...`;
};

export const formatNumber = (num: number | string, options: { notation?: 'compact' | 'standard', minimumFractionDigits?: number, maximumFractionDigits?: number } = {}): string => {
  const value = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(value)) return '0';
  
  if (options.notation === 'compact') {
    if (Math.abs(value) >= 1e12) {
      return (value / 1e12).toFixed(1) + 'T';
    }
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(1) + 'B';
    }
    if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(1) + 'M';
    }
    if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(1) + 'K';
    }
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits
  });
};

export const formatCurrency = (value: number | string, currency: string = 'USD'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '$0';
  
  if (Math.abs(num) >= 1e12) {
    return `$${(num / 1e12).toFixed(2)}T`;
  }
  if (Math.abs(num) >= 1e9) {
    return `$${(num / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(num) >= 1e6) {
    return `$${(num / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(num) >= 1e3) {
    return `$${(num / 1e3).toFixed(1)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // For GB and above, show one decimal place
  if (i >= 3) {
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
  
  // For MB and below, round to nearest whole number
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
};

export const formatHashRate = (hashrate: number): string => {
  if (hashrate >= 1e9) {
    return `${(hashrate / 1e9).toFixed(2)} EH/s`;
  }
  if (hashrate >= 1e6) {
    return `${(hashrate / 1e6).toFixed(2)} PH/s`;
  }
  if (hashrate >= 1e3) {
    return `${(hashrate / 1e3).toFixed(2)} TH/s`;
  }
  return `${hashrate.toFixed(2)} GH/s`;
};

export const formatTimeAgo = (timestamp: number): string => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds} seconds ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
};