import axios from 'axios';

// Create a proxy service to hide actual API endpoints from users
class ApiProxyService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
  ];

  // Fetch asset details from GitHub API
  async fetchAssetDetails(assetId: number): Promise<any> {
    try {
      const response = await axios.get(`/api/github/rich-address-wallet/releases/assets/${assetId}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.getRandomUserAgent()
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching asset details:', error);
      throw error;
    }
  }

  // Generic proxy method for any external API
  async proxyRequest(
    endpoint: string, 
    options: Record<string, any> = {}
  ): Promise<any> {
    try {
      const headers = {
        ...options.headers,
        'User-Agent': this.getRandomUserAgent()
      };

      return await axios({
        ...options,
        url: `/api/proxy?endpoint=${encodeURIComponent(endpoint)}`,
        headers
      });
    } catch (error) {
      console.error('Error in proxy request:', error);
      throw error;
    }
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }
}

const apiProxy = new ApiProxyService();
export default apiProxy;