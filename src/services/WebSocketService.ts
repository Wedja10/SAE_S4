import { useEffect, useRef } from 'react';
import { getWsUrl } from '../utils/config';

export type LobbyEventType = 'player_join' | 'player_leave' | 'settings_update' | 'game_start' | 'chat_message' | 'private_message' | 'host_change' | 'player_rename' | 'profile_picture_change' | 'game_start_error' | 'ping' | 'player_kick' | 'player_ban' | 'player_kicked' | 'player_banned' | 'join_banned';

export type LobbyEvent = {
  type: LobbyEventType;
  data: any;
};

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private listeners: ((event: LobbyEvent) => void)[] = [];
  private pendingEvents: LobbyEvent[] = [];
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10; // Increased from 3 to 10
  private reconnectDelay = 5000; // 5 seconds base delay
  private isReconnecting = false;
  private lastPingTime = 0;
  private lastPongTime = 0;
  private lastEventSent: { type: LobbyEventType; timestamp: number } | null = null;
  private eventSendCount: Map<string, number> = new Map();
  // Track the last join event for each player-lobby pair
  private playerJoinTimestamps: Map<string, number> = new Map();
  // Track if a leave event has been sent for a player-lobby pair
  private leaveEventSent: Set<string> = new Set();
  // Store current lobby and player information for reconnection
  private currentLobby: string | null = null;
  private currentPlayer: any = null;
  // Connection status tracking
  private connected: boolean = false;
  private connectionStatusListeners: ((connected: boolean) => void)[] = [];

  private constructor() {
    this.connect();
    
    // Listen for page unload but don't close the connection
    window.addEventListener('beforeunload', this.handleBeforeUnload);
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }
  
  private handleBeforeUnload = () => {
    // Don't close the connection on page unload
    // This allows the browser to keep the connection alive during page refreshes
    console.log('Page unloading, but keeping WebSocket connection alive');
    
    // We still want to clear any timers to prevent memory leaks
    this.clearTimers();
  }
  
  private handleOnline = () => {
    console.log('Network connection restored. Reconnecting WebSocket...');
    // Reset reconnect attempts when network comes back online
    this.reconnectAttempts = 0;
    this.connect();
  }
  
  private handleOffline = () => {
    console.log('Network connection lost. WebSocket will reconnect when online.');
    this.clearTimers();
    // Don't try to reconnect while offline
    this.isReconnecting = true;
  }

  private clearTimers() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private connect() {
    // Don't try to connect if we're offline
    if (!navigator.onLine) {
      console.log('Device is offline. Will connect when online.');
      return;
    }
    
    if (this.isReconnecting) {
      console.log('Already attempting to reconnect...');
      return;
    }
    
    this.isReconnecting = true;
    const WS_URL = getWsUrl();
    
    // Store current state before reconnecting
    const hadPreviousConnection = this.ws !== null;
    
    // Close any existing connection before creating a new one
    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
          console.log('Closing existing connection before reconnecting');
          // Don't use "Page unload" reason here to avoid triggering special handling
          this.ws.close(1000, "Reconnecting");
        }
      } catch (e) {
        console.log('Error closing existing connection:', e);
      }
      
      // Small delay to ensure the previous connection is properly closed
      setTimeout(() => {
        this.createNewConnection(WS_URL, hadPreviousConnection);
      }, 1000);
    } else {
      this.createNewConnection(WS_URL, hadPreviousConnection);
    }
  }
  
  private createNewConnection(WS_URL: string, isReconnect: boolean = false) {
    console.log(`${isReconnect ? 'Reconnecting' : 'Connecting'} to WebSocket server: ${WS_URL} (Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log('✅ Connected to WebSocket server');
        this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        this.isReconnecting = false;
        
        // Update connection status
        this.setConnected(true);
        
        // Reset leave event tracking on new connection
        this.leaveEventSent.clear();
        
        // Set up ping interval to keep connection alive
        this.setupPingInterval();
        
        // Check if we need to prioritize rejoining a lobby
        let rejoinEvent: LobbyEvent | null = null;
        
        // First check if we have stored lobby and player information
        if (this.currentLobby && this.currentPlayer) {
          console.log(`Automatically rejoining lobby ${this.currentLobby} with player ${this.currentPlayer.id}`);
          rejoinEvent = {
            type: 'player_join',
            data: {
              gameCode: this.currentLobby,
              player: this.currentPlayer
            }
          };
        } else {
          // Find the most recent join event in pending events
          for (let i = this.pendingEvents.length - 1; i >= 0; i--) {
            const event = this.pendingEvents[i];
            if (event.type === 'player_join') {
              rejoinEvent = event;
              // Remove it from pending events as we'll send it first
              this.pendingEvents.splice(i, 1);
              break;
            }
          }
        }
        
        // If we found a join event, send it immediately
        if (rejoinEvent) {
          console.log('Prioritizing rejoining lobby after reconnection');
          setTimeout(() => {
            this.sendEvent(rejoinEvent as LobbyEvent);
          }, 500);
        }
        
        // Re-send any pending events, but avoid sending duplicates
        if (this.pendingEvents.length > 0) {
          console.log(`Processing ${this.pendingEvents.length} pending events`);
          
          // Filter out duplicate events (same type within 5 seconds)
          const now = Date.now();
          const uniqueEvents = this.pendingEvents.filter(event => {
            // Always send non-player_join events
            if (event.type !== 'player_join') return true;
            
            // For player_join, check if we've sent this recently
            const key = `${event.type}-${JSON.stringify(event.data)}`;
            const count = this.eventSendCount.get(key) || 0;
            
            // If we've sent this exact event more than 2 times, or if we sent it recently, skip it
            if (count > 2) {
              console.log(`Skipping duplicate event: ${event.type} (sent ${count} times already)`);
              return false;
            }
            
            // If we sent this event type recently, skip it
            if (this.lastEventSent && 
                this.lastEventSent.type === event.type && 
                now - this.lastEventSent.timestamp < 5000) {
              console.log(`Skipping recent event: ${event.type} (sent ${(now - this.lastEventSent.timestamp)/1000}s ago)`);
              return false;
            }
            
            return true;
          });
          
          console.log(`Sending ${uniqueEvents.length} unique pending events (filtered from ${this.pendingEvents.length})`);
          
          // Add a small delay before sending events to ensure the connection is fully established
          setTimeout(() => {
            uniqueEvents.forEach(event => this.sendEvent(event));
            this.pendingEvents = [];
          }, 500);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const lobbyEvent: LobbyEvent = JSON.parse(event.data);
          
          // Handle ping messages
          if (this.isPingEvent(lobbyEvent)) {
            this.lastPongTime = Date.now();
            // Send pong response directly without using sendEvent to avoid logging
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping', data: { pong: true, timestamp: Date.now() } }));
            }
            return;
          }
          
          // Only log non-ping messages
          if (!this.isPingEvent(lobbyEvent)) {
            console.log('Received WebSocket message:', lobbyEvent);
          }
          
          this.notifyListeners(lobbyEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} - ${event.reason}`);
        
        // Update connection status
        this.setConnected(false);
        
        // Clear ping interval
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
        
        // Don't attempt to reconnect if this was a normal closure during page unload
        if (event.code === 1000 && event.reason === "Page unload") {
          console.log('Normal closure during page unload, not reconnecting');
          return;
        }
        
        // Schedule reconnect
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Update connection status
        this.setConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isReconnecting = false;
      
      // Still attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay;
        
        console.log(`Error connecting. Attempting to reconnect in ${delay/1000} seconds...`);
        this.reconnectTimeout = setTimeout(() => {
          this.isReconnecting = false;
          this.connect();
        }, delay);
      }
    }
  }
  
  private setupPingInterval() {
    // Clear any existing interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Set up a new ping interval (every 15 seconds)
    this.pingInterval = setInterval(() => {
      // Check if connection is still alive
      const now = Date.now();
      
      // If we haven't received a pong in 45 seconds and we've sent at least one ping
      if (this.lastPingTime > 0 && this.lastPongTime > 0 && 
          now - this.lastPongTime > 45000 && 
          this.ws?.readyState === WebSocket.OPEN) {
        console.log('No pong received for 45 seconds, reconnecting...');
        
        try {
          this.ws.close(1000, "No pong received");
        } catch (e) {
          console.log('Error closing stale connection:', e);
        }
        
        this.isReconnecting = false;
        this.connect();
        return;
      }
      
      // Only send ping if the connection is open
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.lastPingTime = now;
          // Send ping directly without using sendEvent to avoid logging
          this.ws.send(JSON.stringify({ type: 'ping', data: { timestamp: now } }));
        } catch (error) {
          console.warn('Error sending ping:', error);
        }
      } else if (this.ws?.readyState === WebSocket.CLOSED || this.ws?.readyState === WebSocket.CLOSING) {
        // If the connection is closed or closing, try to reconnect
        if (!this.isReconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
          console.log('Connection is closed, attempting to reconnect...');
          this.connect();
        }
      }
    }, 15000); // 15 seconds
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

  // Helper function to check if an event is a ping event
  private isPingEvent(event: LobbyEvent): boolean {
    return event.type === 'ping' as LobbyEventType;
  }

  sendEvent(event: LobbyEvent) {
    // Don't log ping events to reduce console noise
    if (!this.isPingEvent(event)) {
      console.log('Sending WebSocket event:', event);
    }
    
    // Special handling for join and leave events
    if (event.type === 'player_join' || event.type === 'player_leave') {
      // Create a unique key for this player and lobby
      let playerKey: string;
      
      if (event.type === 'player_join') {
        const { gameCode, player } = event.data;
        playerKey = `${player.id}-${gameCode}`;
        
        // Check if player is banned from this game before trying to join
        try {
          const bannedGames = JSON.parse(localStorage.getItem('bannedGames') || '{}');
          const isBanned = bannedGames[gameCode];
          
          if (isBanned) {
            console.log(`Player ${player.id} is banned from game ${gameCode}. Preventing join attempt.`);
            console.log(`Ban reason: ${isBanned.reason || 'No reason provided'}`);
            
            // Clear game code and redirect to home
            localStorage.removeItem('gameCode');
            window.location.href = '/';
            
            // Don't send the join event
            return;
          }
        } catch (e) {
          console.error('Error checking ban status:', e);
        }
        
        // Store current lobby and player information for reconnection
        this.currentLobby = gameCode;
        this.currentPlayer = player;
        
        // Record the join timestamp for this player-lobby pair
        this.playerJoinTimestamps.set(playerKey, Date.now());
        
        // Clear any leave event tracking for this player-lobby pair
        this.leaveEventSent.delete(playerKey);
        
        // Ensure player has all required fields
        if (!player.pp) {
          const storedProfilePic = localStorage.getItem('profilePicture');
          if (storedProfilePic && player.id === localStorage.getItem('playerId')) {
            player.pp = storedProfilePic;
          }
        }
        
        if (!player.pp_color) {
          const storedProfilePicColor = localStorage.getItem('profilePictureColor');
          if (storedProfilePicColor && player.id === localStorage.getItem('playerId')) {
            player.pp_color = storedProfilePicColor;
          }
        }
      } else { // player_leave
        const { gameCode, playerId } = event.data;
        playerKey = `${playerId}-${gameCode}`;
        
        // Check if we've already sent a leave event for this player-lobby pair
        if (this.leaveEventSent.has(playerKey)) {
          console.log(`Already sent a leave event for player ${playerId} in lobby ${gameCode}, preventing duplicate`);
          return;
        }
        
        // Check if this player just joined (within the last 3 seconds)
        const joinTimestamp = this.playerJoinTimestamps.get(playerKey);
        if (joinTimestamp && Date.now() - joinTimestamp < 3000) {
          console.log(`Player ${playerId} just joined lobby ${gameCode} ${(Date.now() - joinTimestamp)/1000}s ago, preventing leave event`);
          return;
        }
        
        // Mark that we're sending a leave event for this player-lobby pair
        this.leaveEventSent.add(playerKey);
        
        // Clear current lobby and player information if we're leaving the current lobby
        if (this.currentLobby === gameCode && this.currentPlayer && this.currentPlayer.id === playerId) {
          this.currentLobby = null;
          this.currentPlayer = null;
        }
      }
      
      // Track event count for debugging
      const key = `${event.type}-${JSON.stringify(event.data)}`;
      const count = this.eventSendCount.get(key) || 0;
      this.eventSendCount.set(key, count + 1);
      
      this.lastEventSent = { type: event.type, timestamp: Date.now() };
    } else if (event.type === 'chat_message') {
      // For chat messages, we don't need to track as much
      // Just make sure we have a gameCode in the data
      if (!event.data.gameCode && this.currentLobby) {
        // If no gameCode is provided but we have a current lobby, use that
        event.data.gameCode = this.currentLobby;
      }
      
      // Add timestamp if not present
      if (!event.data.timestamp) {
        event.data.timestamp = Date.now();
      }
      
      // Add player name if not present
      if (!event.data.playerName) {
        const storedName = localStorage.getItem('playerName');
        if (storedName && event.data.playerId === localStorage.getItem('playerId')) {
          event.data.playerName = storedName;
        }
      }
      
      // Log chat message for debugging (without the actual message content for privacy)
      console.log(`Sending chat message from ${event.data.playerName} in lobby ${event.data.gameCode}`);
    }
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(event));
      } catch (error) {
        console.warn(`Error sending event: ${error}`);
        
        // Only store non-leave events for later sending
        if (event.type !== 'player_leave') {
          this.pendingEvents.push(event);
        }
        
        // Try to reconnect if connection seems broken
        if (!this.isReconnecting) {
          this.connect();
        }
      }
    } else {
      // Only log for non-ping messages
      if (!this.isPingEvent(event)) {
        console.warn(`WebSocket is not connected. Current state: ${this.ws?.readyState}. Storing event for later.`);
      }
      
      // Only store non-leave events for later sending
      if (event.type !== 'player_leave') {
        this.pendingEvents.push(event);
      }
      
      // Try to reconnect only if not already reconnecting
      if ((!this.ws || this.ws.readyState === WebSocket.CLOSED) && !this.isReconnecting) {
        this.connect();
      }
    }
  }
  
  // Method to explicitly close the connection
  close() {
    this.clearTimers();
    
    if (this.ws) {
      try {
        this.ws.close(1000, "Intentional close");
      } catch (e) {
        console.log('Error during intentional close:', e);
      }
    }
    
    // Clean up event listeners
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
  
  // Cleanup method to be called when component unmounts
  cleanup() {
    // Remove all listeners
    this.listeners = [];
  }

  // Set connection status and notify listeners
  private setConnected(status: boolean) {
    if (this.connected !== status) {
      this.connected = status;
      // Notify all connection status listeners
      this.connectionStatusListeners.forEach(listener => {
        try {
          listener(status);
        } catch (error) {
          console.error('Error in connection status listener:', error);
        }
      });
    }
  }

  // Get current connection status
  public getConnectionStatus(): boolean {
    return this.connected;
  }

  // Add connection status listener (instance method)
  public addConnectionStatusListener(listener: (connected: boolean) => void): void {
    this.connectionStatusListeners.push(listener);
    // Immediately notify with current status
    listener(this.connected);
  }

  // Remove connection status listener (instance method)
  public removeConnectionStatusListener(listener: (connected: boolean) => void): void {
    this.connectionStatusListeners = this.connectionStatusListeners.filter(l => l !== listener);
  }

  // Public methods for connection status
  public static isConnected(): boolean {
    return WebSocketService.getInstance().connected;
  }

  public static addConnectionStatusListener(listener: (connected: boolean) => void): void {
    const instance = WebSocketService.getInstance();
    instance.connectionStatusListeners.push(listener);
    // Immediately notify with current status
    listener(instance.connected);
  }

  public static removeConnectionStatusListener(listener: (connected: boolean) => void): void {
    const instance = WebSocketService.getInstance();
    instance.connectionStatusListeners = instance.connectionStatusListeners.filter(l => l !== listener);
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log(`Maximum reconnect attempts (${this.maxReconnectAttempts}) reached. Giving up.`);
      return;
    }
    
    // Use exponential backoff with a maximum delay
    const baseDelay = this.reconnectDelay;
    const maxDelay = 30000; // 30 seconds max
    const delay = Math.min(baseDelay * Math.pow(1.5, this.reconnectAttempts - 1), maxDelay);
    
    console.log(`Attempting to reconnect in ${delay/1000} seconds... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.connect();
    }, delay);
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