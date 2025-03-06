import { MessageCallback, ErrorCallback } from '../types';

export class BlockchainWebSocket {
  private socket: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 2000;
  private subscriptions: { op: string; [key: string]: any }[] = [];
  private messageCallbacks: Map<string, MessageCallback[]> = new Map();
  private errorCallback: ErrorCallback | null = null;
  private pingInterval: number | null = null;
  private useMockData = false;
  private currentEndpointIndex = 0;
  private endpoints: string[];

  constructor(urlOrUrls: string | string[]) {
    this.endpoints = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
  }

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!('WebSocket' in window)) {
          console.warn('WebSocket is not supported by this browser');
          this.useMockData = true;
          resolve();
          return;
        }

        this.connectToEndpoint(resolve);
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.useMockData = true;
        resolve();
      }
    });
  }

  private connectToEndpoint(resolve: () => void): void {
    if (this.currentEndpointIndex >= this.endpoints.length) {
      console.warn('All WebSocket endpoints failed, using mock data');
      this.useMockData = true;
      resolve();
      return;
    }

    const endpoint = this.endpoints[this.currentEndpointIndex];
    
    try {
      this.socket = new WebSocket(endpoint);

      // Set a timeout for the connection
      const connectionTimeout = setTimeout(() => {
        if (this.socket && this.socket.readyState !== WebSocket.OPEN) {
          console.warn(`WebSocket connection timeout for ${endpoint}`);
          this.socket.close();
          this.currentEndpointIndex++;
          this.connectToEndpoint(resolve);
        }
      }, 5000);

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

      this.socket.onmessage = this.handleMessage.bind(this);

      this.socket.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.warn(`WebSocket error on ${endpoint}:`, error);
        
        if (this.errorCallback) {
          this.errorCallback(error);
        }

        // Try next endpoint
        this.currentEndpointIndex++;
        this.connectToEndpoint(resolve);
      };

      this.socket.onclose = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connection closed');
        this.isConnected = false;
        this.stopPingInterval();
        
        if (!this.useMockData) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error(`Error connecting to ${endpoint}:`, error);
      this.currentEndpointIndex++;
      this.connectToEndpoint(resolve);
    }
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const op = data.op;
      
      if (this.messageCallbacks.has(op)) {
        const callbacks = this.messageCallbacks.get(op) || [];
        callbacks.forEach(callback => callback(data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private startPingInterval(): void {
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
        console.warn('Error sending ping:', error);
        this.handleConnectionFailure();
      }
    }
  }

  private handleConnectionFailure(): void {
    this.useMockData = true;
    this.isConnected = false;
    this.socket?.close();
    this.stopPingInterval();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.currentEndpointIndex = 0; // Reset endpoint index
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          this.useMockData = true;
        });
      }, this.reconnectTimeout * this.reconnectAttempts);
    } else {
      console.warn('Maximum reconnection attempts reached, using mock data');
      this.useMockData = true;
    }
  }

  private resubscribe(): void {
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach(subscription => {
        try {
          this.socket?.send(JSON.stringify(subscription));
        } catch (error) {
          console.warn('Error resubscribing:', error);
        }
      });
    }
  }

  public subscribe(subscription: { op: string; [key: string]: any }): void {
    if (!this.subscriptions.some(sub => JSON.stringify(sub) === JSON.stringify(subscription))) {
      this.subscriptions.push(subscription);
    }
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(subscription));
      } catch (error) {
        console.warn('Error subscribing:', error);
      }
    }
  }

  public unsubscribe(op: string): void {
    this.subscriptions = this.subscriptions.filter(sub => sub.op !== op);
    
    if (this.isConnected && this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ op: `un${op}` }));
      } catch (error) {
        console.warn('Error unsubscribing:', error);
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
        console.warn('Error closing WebSocket:', error);
      }
      this.socket = null;
    }
    this.isConnected = false;
  }

  public isUsingMockData(): boolean {
    return this.useMockData;
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