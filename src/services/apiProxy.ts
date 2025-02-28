import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Create a proxy service to hide actual API endpoints from users
class ApiProxyService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
  ];

  // Create a proxy request that doesn't expose the actual endpoint to the client
  async fetchFromGitHub(endpoint: string = 'releases'): Promise<any> {
    try {
      // Use a local endpoint that will be proxied by the server
      const response = await axios.get('/api/github/rich-address-wallet/' + endpoint, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': this.getRandomUserAgent()
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching from GitHub API:', error);
      throw error;
    }
  }

  // Generic proxy method for any external API
  async proxyRequest(
    endpoint: string, 
    options: AxiosRequestConfig = {}
  ): Promise<AxiosResponse> {
    try {
      // Add random user agent to avoid being blocked
      const headers = {
        ...options.headers,
        'User-Agent': this.getRandomUserAgent()
      };

      // Make the request through our proxy endpoint
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

// Create a singleton instance
const apiProxy = new ApiProxyService();
export default apiProxy;