import Playerpicture from '/assets/playerPicture.png';
import chatIcon from '/assets/chatIcon.svg';
import { PlayerName } from './PlayerName';
import { useWebSocket } from '../../services/WebSocketService';
import { Storage } from '../../utils/storage';
import { useState, useEffect, useRef } from 'react';
import { ProfilePicture } from './ProfilePicture';
import { ModerationButton } from './ModerationComponents';
import './LobbyComponents.css';

interface PlayerProps {
  player: {
    id: string;
    pseudo: string;
    pp: string;
    pp_color?: string;
    is_host: boolean;
  };
  self: boolean;
  onChatClick: () => void;
  hasUnreadMessages?: boolean;
}

interface ChatButtonProps {
  onClick: () => void;
  hasUnreadMessages: boolean;
}

export const ChatButton = ({ onClick, hasUnreadMessages }: ChatButtonProps) => {
  return (
    <button className="ChatButton" onClick={onClick}>
      <img src={chatIcon} alt="Chat" />
      <p>Chat</p>
      {hasUnreadMessages && <div className="notification-dot"></div>}
    </button>
  );
};

export const Player = ({ player, onChatClick, self, hasUnreadMessages = false }: PlayerProps) => {
  const currentUserId = localStorage.getItem('playerId');
  const [currentPicture, setCurrentPicture] = useState(player.pp || Playerpicture);
  const [currentSkinColor, setCurrentSkinColor] = useState(player.pp_color || '#FFAD80');
  const gameCode = Storage.getGameCode();
  const isHost = localStorage.getItem('isHost') === 'true';
  
  const ws = useWebSocket((event) => {
    if (event.type === 'profile_picture_change' && event.data.playerId === player.id) {
      setCurrentPicture(event.data.pictureUrl);
      setCurrentSkinColor(event.data.pp_color || '#FFAD80');
      
      // Store in localStorage if this is the current player
      if (self) {
        Storage.setProfilePicture(event.data.pictureUrl);
        Storage.setProfilePictureColor(event.data.pp_color || '#FFAD80');
        console.log(`Profile picture "${event.data.pictureUrl}" and color "${event.data.pp_color || '#FFAD80'}" stored in localStorage`);
      }
    }
    // When a new player joins, broadcast your profile if you're an existing player
    else if (event.type === 'player_join' && self && gameCode) {
      // Small delay to ensure the new player has fully joined
      setTimeout(() => {
        console.log('Broadcasting profile to new player');
        // Send your current profile picture and skin color to ensure new players see it
        ws.sendEvent({
          type: 'profile_picture_change',
          data: {
            gameCode,
            playerId: player.id,
            pictureUrl: currentPicture,
            pp_color: currentSkinColor
          }
        });
        
        // Also broadcast your name
        ws.sendEvent({
          type: 'player_rename',
          data: {
            gameCode,
            playerId: player.id,
            newName: player.pseudo
          }
        });
      }, 500);
    }
  });

  useEffect(() => {
    // If this is the current player, check for stored values
    if (self) {
      const storedProfilePic = Storage.getProfilePicture();
      const storedProfilePicColor = Storage.getProfilePictureColor();
      
      // Use stored values if available, otherwise use player values
      if (storedProfilePic) {
        setCurrentPicture(storedProfilePic);
      } else {
        setCurrentPicture(player.pp || Playerpicture);
      }
      
      if (storedProfilePicColor) {
        setCurrentSkinColor(storedProfilePicColor);
      } else {
        setCurrentSkinColor(player.pp_color || '#FFAD80');
      }
    } else {
      // For other players, just use the values from the player object
      setCurrentPicture(player.pp || Playerpicture);
      setCurrentSkinColor(player.pp_color || '#FFAD80');
    }
  }, [player.pp, player.pp_color, self]);

  const handleRename = (newName: string) => {
    if (gameCode) {
      ws.sendEvent({
        type: 'player_rename',
        data: {
          gameCode,
          playerId: player.id,
          newName
        }
      });
    }
  };

  const handlePictureChange = (newPictureUrl: string, skinColor?: string) => {
    if (gameCode && newPictureUrl) {
      const finalSkinColor = skinColor || '#FFAD80';
      
      ws.sendEvent({
        type: 'profile_picture_change',
        data: {
          gameCode,
          playerId: player.id,
          pictureUrl: newPictureUrl,
          pp_color: finalSkinColor
        }
      });
      
      setCurrentPicture(newPictureUrl);
      setCurrentSkinColor(finalSkinColor);
      
      // Store in localStorage if this is the current player
      if (self) {
        Storage.setProfilePicture(newPictureUrl);
        Storage.setProfilePictureColor(finalSkinColor);
        console.log(`Profile picture "${newPictureUrl}" and color "${finalSkinColor}" stored in localStorage`);
      }
    }
  };

  return (
    <div className="Player fade-in">
      <div style={{
        border: player.is_host ? '2px solid #E09D2D' : '2px solid #FFFFFF',
        borderRadius: '50%',
        padding: '1px',
        marginTop: '1px',
        width: '52px',
        height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <ProfilePicture
          currentPicture={currentPicture}
          isCurrentPlayer={self}
          onPictureChange={handlePictureChange}
          currentSkinColor={currentSkinColor}
        />
      </div>
      <div className="player-info">
        <PlayerName
          name={player.pseudo}
          isCurrentPlayer={self}
          onRename={handleRename}
        />
        {player.is_host && <span className="host-badge">HOST</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {currentUserId !== player.id && <ChatButton onClick={onChatClick} hasUnreadMessages={hasUnreadMessages} />}
        {currentUserId !== player.id && <ModerationButton targetPlayerId={player.id} targetPlayerName={player.pseudo} isHost={isHost} />}
      </div>
    </div>
  );
};

interface PlayerListProps {
  players: Array<{
    id: string;
    pseudo: string;
    pp: string;
    pp_color?: string;
    is_host: boolean;
  }>;
  currentPlayerId?: string;
}

export const PlayerList = ({ players, currentPlayerId }: PlayerListProps) => {
  const [chatOpen, setChatOpen] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Record<string, Array<{
    content: string;
    sender: string;
    timestamp: number;
    isFromMe: boolean;
  }>>>({});
  const [unreadMessages, setUnreadMessages] = useState<Record<string, boolean>>({});
  const chatContentRef = useRef<HTMLDivElement>(null);
  const gameCode = Storage.getGameCode();

  // Find player by name to get their ID
  const getPlayerIdByName = (name: string) => {
    const player = players.find(p => p.pseudo === name);
    return player ? player.id : null;
  };

  // Get the current chat's recipient ID
  const recipientId = getPlayerIdByName(chatOpen);

  // Setup WebSocket listener for private messages
  const ws = useWebSocket((event) => {
    if (event.type === 'private_message') {
      const isIncomingMessage = event.data.recipientId === currentPlayerId;
      const isOutgoingConfirmation = event.data.isServerEcho && event.data.playerId === currentPlayerId;
      
      if (isIncomingMessage || isOutgoingConfirmation) {
        // Identify the conversation partner
        const conversationPartnerId = isIncomingMessage ? event.data.playerId : event.data.recipientId;
        const conversationPartner = players.find(p => p.id === conversationPartnerId);
        
        if (conversationPartner) {
          // Add message to the conversation
          const partnerName = conversationPartner.pseudo;
          const newMessage = {
            content: event.data.message,
            sender: isIncomingMessage ? partnerName : 'Me',
            timestamp: event.data.timestamp || Date.now(),
            isFromMe: !isIncomingMessage
          };
          
          setMessages(prev => {
            const conversationMessages = prev[partnerName] || [];
            return {
              ...prev,
              [partnerName]: [...conversationMessages, newMessage]
            };
          });
          
          // If this is a new message from someone else and chat isn't open with them, mark as unread
          if (isIncomingMessage && chatOpen !== partnerName) {
            setUnreadMessages(prev => ({
              ...prev,
              [partnerName]: true
            }));
            console.log(`New message from ${partnerName}`);
          }
        }
      }
    }
  });

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContentRef.current) {
      // Delay the scroll to allow the DOM to update
      setTimeout(() => {
        if (chatContentRef.current) {
          chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [messages, chatOpen]);

  const handleChatClick = (playerName: string) => {
    if (chatOpen === playerName) {
      setChatOpen('');
    } else {
      setChatOpen(playerName);
      // Clear unread messages indicator when opening chat
      setUnreadMessages(prev => ({
        ...prev,
        [playerName]: false
      }));
    }
    setMessage('');
  };

  const handleTypeMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (message.trim() === '' || !recipientId || !currentPlayerId || !gameCode) return;
    
    const timestamp = Date.now();
    
    // Send private message via WebSocket
    ws.sendEvent({
      type: 'private_message',
      data: {
        gameCode,
        playerId: currentPlayerId,
        senderName: Storage.getPlayerName() || 'Me',
        recipientId,
        message: message.trim(),
        timestamp
      }
    });
    
    // Optimistically add message to UI before server confirmation
    setMessages(prev => {
      const conversationMessages = prev[chatOpen] || [];
      return {
        ...prev,
        [chatOpen]: [...conversationMessages, {
          content: message.trim(),
          sender: 'Me',
          timestamp,
          isFromMe: true
        }]
      };
    });
    
    // Scroll to bottom after sending message
    setTimeout(() => {
      if (chatContentRef.current) {
        chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight;
      }
    }, 50);
    
    setMessage('');
  };

  if (chatOpen === '') { // Display player list when no chat is open
    return (
      <div className="PlayerList">
        <div className="LobbyTitle fade-in">LOBBY</div>
        {players.map((player) => (
          <Player
            key={player.id}
            player={player}
            self={player.id === currentPlayerId}
            onChatClick={() => handleChatClick(player.pseudo)}
            hasUnreadMessages={unreadMessages[player.pseudo] || false}
          />
        ))}
      </div>
    );
  } else { // Display private chat when a chat is open
    const currentMessages = messages[chatOpen] || [];
    
    return (
      <div className="PrivateChatbox">
        <div className="ChatboxHeader">
          <img 
            src="/assets/closeChatbox.svg" 
            alt="X" 
            onClick={() => handleChatClick('')} 
            style={{
              cursor: 'pointer',
              height: '25px'
            }}
          />
          <p>{chatOpen}</p>
        </div>
        <div className="ChatboxContent" ref={chatContentRef}>
          {currentMessages.length === 0 ? (
            <div className="empty-chat-message">
              No messages yet. Say hello!
            </div>
          ) : (
            currentMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`chat-message ${msg.isFromMe ? 'message-sent' : 'message-received'}`}
              >
                <div className="message-content">{msg.content}</div>
                <div className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="ChatboxInput">
          <input 
            type="text" 
            className="textInput" 
            placeholder="Message..." 
            value={message}
            onChange={handleTypeMessage}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <img 
            src="/assets/sendPlane.svg" 
            alt="Send" 
            onClick={handleSendMessage} 
            style={{
              cursor: 'pointer',
              height: '28px'
            }} 
          />
        </div>
      </div>
    );
  }
};