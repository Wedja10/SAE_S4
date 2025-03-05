import { useEffect, useRef } from 'react';
import { getWsUrl } from '../utils/config';

export type LobbyEvent = {
  type: 'player_join' | 'player_leave' | 'settings_update' | 'game_start' | 'chat_message' | 'host_change' | 'player_rename' | 'profile_picture_change';
  data: any;
};

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private listeners: ((event: LobbyEvent) => void)[] = [];
  private pendingEvents: LobbyEvent[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isClosingIntentionally = false;

  private constructor() {
    this.connect();
    
    // Listen for page unload to properly close the connection
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }
  
  private handleBeforeUnload = () => {
    this.isClosingIntentionally = true;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // We're intentionally closing, don't try to reconnect
      this.ws.close();
    }
    
    // Clear any reconnect timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    const WS_URL = getWsUrl();
    
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('WebSocket is already connecting...');
      return;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected');
      return;
    }

    console.log('Connecting to WebSocket server:', WS_URL);
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('✅ Connected to WebSocket server');
      // Re-send any pending events
      if (this.pendingEvents.length > 0) {
        console.log('Sending pending events:', this.pendingEvents);
        this.pendingEvents.forEach(event => this.sendEvent(event));
        this.pendingEvents = [];
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const lobbyEvent: LobbyEvent = JSON.parse(event.data);
        console.log('Received WebSocket message:', lobbyEvent);
        this.notifyListeners(lobbyEvent);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔴 WebSocket connection closed');
      
      // Don't reconnect if we're intentionally closing
      if (!this.isClosingIntentionally) {
        this.reconnectTimeout = setTimeout(() => {
          console.log('Attempting to reconnect...');
          this.connect();
        }, 5000); // Retry connection after 5 seconds
      } else {
        console.log('WebSocket closed intentionally, not reconnecting');
        this.isClosingIntentionally = false; // Reset for future connections
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };
  }

  addListener(callback: (event: LobbyEvent) => void) {
    this.listeners.push(callback);
  }

  removeListener(callback: (event: LobbyEvent) => void) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(event: LobbyEvent) {
    this.listeners.forEach(listener => listener(event));
  }

  sendEvent(event: LobbyEvent) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('Sending WebSocket event:', event);
      this.ws.send(JSON.stringify(event));
    } else {
      console.warn('WebSocket is not connected. Current state:', this.ws?.readyState);
      // Store the event to be sent when connection is restored
      this.pendingEvents.push(event);
      // Try to reconnect
      if (this.ws?.readyState === WebSocket.CLOSED) {
        this.connect();
      }
    }
  }
  
  // Method to explicitly close the connection
  close() {
    this.isClosingIntentionally = true;
    if (this.ws) {
      this.ws.close();
    }
    
    // Clean up event listeners
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    // Clear any reconnect timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }
  
  // Cleanup method to be called when component unmounts
  cleanup() {
    // Remove all listeners
    this.listeners = [];
  }
}

export const useWebSocket = (callback: (event: LobbyEvent) => void) => {
  const wsService = useRef(WebSocketService.getInstance());

  useEffect(() => {
    wsService.current.addListener(callback);
    return () => {
      wsService.current.removeListener(callback);
    };
  }, [callback]);

  return wsService.current;
};

export default WebSocketService;