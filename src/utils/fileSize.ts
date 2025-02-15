import axios from 'axios';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  // For GB, show one decimal place
  if (i === 3) {
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
  
  // For MB and below, round to nearest whole number
  return `${Math.round(bytes / Math.pow(k, i))} ${sizes[i]}`;
};

export const getFileSize = async (url: string): Promise<number> => {
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    
    const contentLength = response.headers['content-length'];
    return contentLength ? parseInt(contentLength, 10) : 0;
  } catch {
    // Return 0 silently instead of logging the error
    return 0;
  }
};