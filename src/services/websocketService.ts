// WebSocket service for Blockchain.com API
// Documentation: https://www.blockchain.com/explorer/api/api_websocket

type MessageCallback = (data: any) => void;
type ErrorCallback = (error: Event) => void;

interface WebSocketSubscription {
  op: string;
  [key: string]: any;
}

export class BlockchainWebSocket {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // Reduced from 5 to 3
  private reconnectTimeout: number = 1000;
  private subscriptions: WebSocketSubscription[] = [];
  private messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private errorCallback: ErrorCallback | null = null;
  private pingInterval: number | null = null;
  private useMockData = false; // Flag to indicate if we should use mock data

  constructor(private url: string = 'wss://ws.blockchain.info/inv') {}

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Check if WebSocket is supported
        if (!('WebSocket' in window)) {
          console.warn('WebSocket is not supported by this browser');
          this.useMockData = true;
          resolve(); // Resolve anyway to allow the app to continue with mock data
          return;
        }

        this.socket = new WebSocket(this.url);

        // Set a timeout for the connection
        const connectionTimeout = setTimeout(() => {
          if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket connection timeout');
            this.socket.close();
            this.useMockData = true;
            resolve(); // Resolve anyway to allow the app to continue with mock data
          }
        }, 5000); // 5 second timeout

        this.socket.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.useMockData = false;
          this.resubscribe();
          this.startPingInterval();
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const op = data.op;
            
            if (this.messageCallbacks.has(op)) {
              const callbacks = this.messageCallbacks.get(op) || [];
              
              // Sanitize the data to prevent "unsupported type for structured data" errors
              const sanitizedData = this.sanitizeData(data);
              
              callbacks.forEach(callback => callback(sanitizedData));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket error:', error);
          this.useMockData = true;
          if (this.errorCallback) {
            this.errorCallback(error);
          }
          // Don't reject, just switch to mock data
          resolve();
        };

        this.socket.onclose = () => {
          clearTimeout(connectionTimeout);
          console.log('WebSocket connection closed');
          this.isConnected = false;
          this.stopPingInterval();
          this.useMockData = true;
          this.attemptReconnect();
          // Don't reject, just switch to mock data
          resolve();
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.useMockData = true;
        // Don't reject, just switch to mock data
        resolve();
      }
    });
  }

  // Sanitize data to ensure it only contains serializable types
  private sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data !== 'object') {
      return data;
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }
    
    const sanitized: any = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        
        if (value === null || value === undefined) {
          sanitized[key] = value;
        } else if (typeof value === 'function') {
          // Skip functions
          continue;
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            sanitized[key] = value.map(item => this.sanitizeData(item));
          } else {
            sanitized[key] = this.sanitizeData(value);
          }
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  public isUsingMockData(): boolean {
    return this.useMockData;
  }

  private startPingInterval(): void {
    // Send a ping every 30 seconds to keep the connection alive
    this.pingInterval = window.setInterval(() => {
      this.ping();
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval !== null) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private ping(): void {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ op: 'ping' }));
      } catch (error) {
        console.error('Error sending ping:', error);
        this.useMockData = true;
        this.isConnected = false;
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.useMockData = true;
        });
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.error('Maximum reconnection attempts reached');
      this.useMockData = true;
    }
  }

  private resubscribe(): void {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach(subscription => {
        try {
          this.socket?.send(JSON.stringify(subscription));
        } catch (error) {
          console.error('Error resubscribing:', error);
        }
      });
    }
  }

  public subscribe(subscription: WebSocketSubscription): void {
    if (!this.subscriptions.some(sub => JSON.stringify(sub) === JSON.stringify(subscription))) {
      this.subscriptions.push(subscription);
    }
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(subscription));
      } catch (error) {
        console.error('Error subscribing:', error);
      }
    }
  }

  public unsubscribe(op: string): void {
    this.subscriptions = this.subscriptions.filter(sub => sub.op !== op);
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ op: `un${op}` }));
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  }

  public onMessage(op: string, callback: MessageCallback): void {
    if (!this.messageCallbacks.has(op)) {
      this.messageCallbacks.set(op, []);
    }
    
    const callbacks = this.messageCallbacks.get(op) || [];
    callbacks.push(callback);
    this.messageCallbacks.set(op, callbacks);
  }

  public onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  public disconnect(): void {
    this.stopPingInterval();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (error) {
        console.error('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
    this.isConnected = false;
  }

  // Subscription methods for different data types
  public subscribeToNewBlocks(): void {
    this.subscribe({ op: 'blocks_sub' });
  }

  public unsubscribeFromNewBlocks(): void {
    this.unsubscribe('blocks_sub');
  }

  public subscribeToNewTransactions(): void {
    this.subscribe({ op: 'unconfirmed_sub' });
  }

  public unsubscribeFromNewTransactions(): void {
    this.unsubscribe('unconfirmed_sub');
  }

  public subscribeToAddress(address: string): void {
    this.subscribe({ op: 'addr_sub', addr: address });
  }

  public unsubscribeFromAddress(address: string): void {
    this.unsubscribe('addr_sub');
  }
}

// Create a singleton instance
const websocketService = new BlockchainWebSocket();
export default websocketService;