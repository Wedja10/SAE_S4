import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../../services/WebSocketService';
import { Storage } from '../../utils/storage';
import './ModerationComponents.css';

interface ModerationButtonProps {
  targetPlayerId: string;
  targetPlayerName: string;
  isHost: boolean;
}

export const ModerationButton: React.FC<ModerationButtonProps> = ({ targetPlayerId, targetPlayerName, isHost }) => {
  const [showPopup, setShowPopup] = useState(false);

  // Only host can see the moderation button
  if (!isHost) return null;

  return (
    <>
      <button 
        className="moderation-button" 
        onClick={() => setShowPopup(true)}
        title="Moderation Actions"
      >
        <img src="/assets/hammerIcon.svg" alt="Moderation" />
      </button>
      
      {showPopup && (
        <ModerationPopup 
          targetPlayerId={targetPlayerId}
          targetPlayerName={targetPlayerName}
          onClose={() => setShowPopup(false)}
        />
      )}
    </>
  );
};

interface ModerationPopupProps {
  targetPlayerId: string;
  targetPlayerName: string;
  onClose: () => void;
}

const ModerationPopup: React.FC<ModerationPopupProps> = ({ targetPlayerId, targetPlayerName, onClose }) => {
  const [reason, setReason] = useState('');
  const gameCode = Storage.getGameCode();
  const hostId = Storage.getPlayerId();
  const ws = useWebSocket(() => {});

  const handleKick = () => {
    if (!gameCode || !hostId) return;
    
    ws.sendEvent({
      type: 'player_kick',
      data: {
        gameCode,
        hostId,
        playerId: targetPlayerId,
        reason
      }
    });
    
    onClose();
  };

  const handleBan = () => {
    if (!gameCode || !hostId) return;
    
    ws.sendEvent({
      type: 'player_ban',
      data: {
        gameCode,
        hostId,
        playerId: targetPlayerId,
        reason
      }
    });
    
    onClose();
  };

  return createPortal(
    <div className="moderation-popup">
      <div className="moderation-popup-content">
        <div className="moderation-popup-header">
          <h2>Moderation: {targetPlayerName}</h2>
          <button onClick={onClose}>&times;</button>
        </div>
        <div className="moderation-popup-body">
          <p>Please provide a reason for the moderation action:</p>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason here..."
          />
        </div>
        <div className="moderation-popup-footer">
          <button className="moderation-button-cancel" onClick={onClose}>Cancel</button>
          <button className="moderation-button-kick" onClick={handleKick}>Kick</button>
          <button className="moderation-button-ban" onClick={handleBan}>Ban</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const ModerationToast: React.FC<{
  type: 'kicked' | 'banned';
  reason: string;
  gameCode: string;
  onClose: () => void;
}> = ({ type, reason, gameCode, onClose }) => {
  const navigate = useNavigate();
  
  const handleOk = () => {
    console.log('ModerationToast: handleOk called');
    
    // Store the ban info in localStorage to show it if they try to rejoin
    if (type === 'banned') {
      const bannedGames = JSON.parse(localStorage.getItem('bannedGames') || '{}');
      bannedGames[gameCode] = { reason, timestamp: Date.now() };
      localStorage.setItem('bannedGames', JSON.stringify(bannedGames));
      console.log('ModerationToast: Stored ban info for game', gameCode);
    }
    
    // First, close the modal to clean up state
    onClose();
    
    // Clear any game-related data from storage before navigating
    Storage.setGameCode('');
    
    // Redirect to home using direct browser navigation to ensure page refresh
    console.log('ModerationToast: Directly navigating to home page');
    window.location.href = '/';
  };
  
  return createPortal(
    <div className="moderation-toast">
      <h3>You have been {type} from the game</h3>
      <p>Reason: {reason || 'No reason provided'}</p>
      <button onClick={handleOk}>OK</button>
    </div>,
    document.body
  );
};

// Hook to handle player being kicked or banned
export const useModerationEvents = () => {
  const [moderationState, setModerationState] = useState<{
    show: boolean;
    type: 'kicked' | 'banned';
    reason: string;
    gameCode: string;
  }>({
    show: false,
    type: 'kicked',
    reason: '',
    gameCode: ''
  });
  
  const navigate = useNavigate();
  
  const handleModerationEvent = (event: any) => {
    if (event.type === 'player_kicked') {
      setModerationState({
        show: true,
        type: 'kicked',
        reason: event.data.reason || 'No reason provided',
        gameCode: event.data.gameCode
      });
    } else if (event.type === 'player_banned') {
      setModerationState({
        show: true,
        type: 'banned',
        reason: event.data.reason || 'No reason provided',
        gameCode: event.data.gameCode
      });
    } else if (event.type === 'join_banned') {
      setModerationState({
        show: true,
        type: 'banned',
        reason: event.data.reason || 'No reason provided',
        gameCode: event.data.gameCode
      });
      // Clear game code from storage
      Storage.setGameCode('');
      // Redirect back to home using direct navigation
      console.log('Redirecting banned player to home page');
      window.location.href = '/';
    }
  };
  
  const clearModerationState = () => {
    setModerationState({
      show: false,
      type: 'kicked',
      reason: '',
      gameCode: ''
    });
  };
  
  return {
    moderationState,
    handleModerationEvent,
    clearModerationState
  };
};

// Function to check if a player is banned from a game
export const checkIfBanned = (gameCode: string) => {
  try {
    const bannedGames = JSON.parse(localStorage.getItem('bannedGames') || '{}');
    return bannedGames[gameCode] || null;
  } catch (e) {
    return null;
  }
}; 