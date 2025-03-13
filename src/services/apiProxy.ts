// services/apiProxy.ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

class ApiProxyService {
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
  ];

  // Method to fetch the GitHub release data.
  async fetchReleaseData(releaseId: string | number): Promise<any> {
    const endpoint = `https://api.github.com/repos/Pymmdrza/Rich-Address-Wallet/releases/${releaseId}/assets`;
    // Use the existing proxyRequest method.  This is MUCH better.
    try {
      const response = await this.proxyRequest(endpoint, {
          headers: {
              'Accept': 'application/vnd.github.v3+json', // Good practice to specify the API version.
          },
      });
      return response.data;
    } catch (error) {
        console.error('Error fetching release data:', error);
        throw error; // Re-throw the error so the caller can handle it.
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
        url: `/api/proxy?endpoint=${encodeURIComponent(endpoint)}`, // Correctly encode the endpoint.
        headers,
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
