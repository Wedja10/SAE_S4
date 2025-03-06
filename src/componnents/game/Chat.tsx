import React, { useState, useEffect, useRef } from "react";
import '../../style/game/Chat.css';
import { Storage } from "../../utils/storage";
import WebSocketService, { useWebSocket, type LobbyEvent } from "../../services/WebSocketService";

interface ChatMessage {
  sender: string;
  content: string;
  isSystem?: boolean;
  senderId?: string;
  timestamp?: number;
  messageId?: string;
  isLocalOnly?: boolean; // Flag to indicate this message is only shown locally before server confirmation
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingMessageIds = useRef<Set<string>>(new Set());
  
  // Use the shared WebSocketService instead of creating a new connection
  const ws = useWebSocket((event: LobbyEvent) => {
    // Handle incoming WebSocket events
    if (event.type === 'chat_message') {
      const playerId = Storage.getPlayerId();
      const senderName = event.data.playerName || "Unknown";
      const senderId = event.data.playerId;
      const messageContent = event.data.message;
      const messageTimestamp = event.data.timestamp || Date.now();
      const messageId = event.data.messageId || `${senderId}-${messageTimestamp}`;
      const isServerEcho = event.data.isServerEcho === true;
      
      console.log(`Received chat message: ${JSON.stringify({
        senderId,
        playerId,
        messageId,
        isServerEcho,
        pendingCount: pendingMessageIds.current.size,
        isPending: pendingMessageIds.current.has(messageId)
      })}`);
      
      // If this is our own message coming back from the server (echo)
      if (senderId === playerId && isServerEcho) {
        // Update any pending messages with this ID to mark them as confirmed
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            (msg.messageId === messageId && msg.isLocalOnly) 
              ? { ...msg, isLocalOnly: false } 
              : msg
          )
        );
        
        // Remove from pending messages since we got confirmation
        if (pendingMessageIds.current.has(messageId)) {
          pendingMessageIds.current.delete(messageId);
          console.log(`Received server echo for message ID: ${messageId}, removed from pending`);
          return; // Don't add the message again
        }
        
        // If we don't have this message ID in pending, it might be from another session
        // We should still show it with "Me" as sender
        console.log(`Received server echo for unknown message ID: ${messageId}`);
      }
      
      // Check if we already have this message (by comparing messageId or content+sender+timestamp)
      const isDuplicate = messages.some(msg => 
        (msg.messageId && msg.messageId === messageId) || 
        (msg.senderId === senderId && 
         msg.content === messageContent && 
         msg.timestamp && Math.abs((msg.timestamp - messageTimestamp)) < 1000)
      );
      
      // Don't add duplicate messages
      if (!isDuplicate) {
        console.log(`Adding new chat message from ${senderName}: ${messageContent}`);
        setMessages((prevMessages) => [
          ...prevMessages, 
          {
            sender: senderId === playerId ? "Me" : senderName,
            content: messageContent,
            senderId: senderId,
            timestamp: messageTimestamp,
            messageId: messageId
          }
        ]);
      }
    } else if (event.type === 'player_join') {
      // Handle player join event
      const playerId = Storage.getPlayerId();
      const playerInfo = event.data.player;
      if (playerInfo && playerInfo.id !== playerId) {
        setMessages(prev => [...prev, {
          sender: "System",
          content: `${playerInfo.pseudo || "A player"} joined the chat`,
          isSystem: true
        }]);
      }
    } else if (event.type === 'player_leave') {
      // Handle player leave event
      const playerId = Storage.getPlayerId();
      const leavingPlayerId = event.data.playerId;
      if (leavingPlayerId && leavingPlayerId !== playerId) {
        setMessages(prev => [...prev, {
          sender: "System",
          content: "A player left the chat",
          isSystem: true
        }]);
      }
    } else if (event.type === 'ping') {
      // Update connection status when we receive a ping
      setIsConnected(true);
    }
  });

  // Check WebSocket connection status
  useEffect(() => {
    // Set initial connection status based on WebSocket state
    setIsConnected(WebSocketService.isConnected());
    
    // Setup connection status listener
    const connectionStatusListener = (connected: boolean) => {
      setIsConnected(connected);
      
      // Add system message about connection status
      if (connected) {
        setMessages(prev => [...prev, {
          sender: "System",
          content: "Connected to chat server",
          isSystem: true,
          timestamp: Date.now()
        }]);
        
        // If we reconnected, check for any pending messages and mark them as potentially failed
        if (pendingMessageIds.current.size > 0) {
          console.log(`Reconnected with ${pendingMessageIds.current.size} pending messages`);
          
          // Update any pending messages to show they might have failed
          setMessages(prevMessages => 
            prevMessages.map(msg => {
              if (msg.isLocalOnly && msg.messageId && pendingMessageIds.current.has(msg.messageId)) {
                return { 
                  ...msg, 
                  content: msg.content + " (may not have been delivered - try resending)",
                  isLocalOnly: false 
                };
              }
              return msg;
            })
          );
          
          // Clear pending messages
          pendingMessageIds.current.clear();
        }
      } else {
        setMessages(prev => [...prev, {
          sender: "System",
          content: "Disconnected from chat server",
          isSystem: true,
          timestamp: Date.now()
        }]);
      }
    };
    
    // Register connection status listener
    WebSocketService.addConnectionStatusListener(connectionStatusListener);
    
    // Cleanup function
    return () => {
      WebSocketService.removeConnectionStatusListener(connectionStatusListener);
    };
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const gameId = Storage.getGameId();
      const gameCode = Storage.getGameCode();
      const playerId = Storage.getPlayerId();
      const playerName = Storage.getPlayerName() || "Me";
      const gameIdentifier = gameId || gameCode;
      const timestamp = Date.now();
      const messageId = `${playerId}-${timestamp}-${Math.random().toString(36).substring(2, 10)}`;
      
      if (!gameIdentifier || !playerId) {
        console.error("Missing game or player information");
        return;
      }
      
      // Create a proper chat message event
      const chatEvent: LobbyEvent = {
        type: 'chat_message',
        data: {
          gameCode: gameIdentifier,
          playerId: playerId,
          playerName: playerName,
          message: newMessage,
          timestamp: timestamp,
          messageId: messageId
        }
      };
      
      // Add to pending message IDs
      pendingMessageIds.current.add(messageId);
      
      // Send using the WebSocketService
      ws.sendEvent(chatEvent);
      
      // Add to local messages with isLocalOnly flag
      setMessages((prevMessages) => [
        ...prevMessages, 
        {
          sender: "Me",
          content: newMessage,
          senderId: playerId,
          timestamp: timestamp,
          messageId: messageId,
          isLocalOnly: true // Mark as local only until server confirms
        }
      ]);
      
      console.log(`Sent message with ID: ${messageId}`);
      setNewMessage(""); // Reset input
    }
  };

  // Get connection status emoji
  const getConnectionStatusEmoji = () => {
    if (isConnected) {
      return "✅"; // Checkmark emoji for connected
    } else {
      return "❌"; // Cross emoji for disconnected
    }
  };

  return (
    <div className="chat-container fade-in">
      <h2 className="chat-title">
        Chat 
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {getConnectionStatusEmoji()}
        </span>
      </h2>
      <div className="chat-box">
        {messages.length === 0 ? (
          <p className="empty-chat">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={msg.messageId || index} 
              className={`chat-message ${msg.isSystem ? 'system-message' : (msg.sender === 'Me' ? 'my-message' : 'other-message')} ${msg.isLocalOnly ? 'local-only' : ''}`}
            >
              {!msg.isSystem && <span className="message-sender">{msg.sender}: </span>}
              <span className="message-content">{msg.content}</span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="sendcontainer">
        <input
          type="text"
          className="chat-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          placeholder="Type your message..."
          disabled={!isConnected}
        />
        <button 
          className="chat-send-button" 
          onClick={handleSendMessage}
          disabled={!isConnected}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
