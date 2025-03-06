import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import { PlayerList } from "../componnents/lobby/LobbyComponents.tsx";
import { ArtefactsList, OptionsPanel, StartButton } from "../componnents/lobby/Artefacts.tsx";
import { useEffect, useState, useCallback } from "react";
import { useWebSocket, type LobbyEvent } from "../services/WebSocketService";
import { useParams, useNavigate } from "react-router-dom";
import { Storage } from "../utils/storage";
import { ProfilePicture } from '../componnents/lobby/ProfilePicture';
import { PlayerName } from '../componnents/lobby/PlayerName';

interface LobbySettings {
  max_players: number | null;
  time_limit: number | null;
  articles_number: number;
  visibility: string;
  allow_join: boolean;
}

interface Player {
  id: string;
  pseudo: string;
  pp: string;
  pp_color?: string;
  is_host: boolean;
  profilePicture?: string;
}

const Lobby: React.FC = () => {
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<LobbySettings>({
    max_players: null,
    time_limit: null,
    articles_number: 5,
    visibility: "private",
    allow_join: true
  });
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [leaveSent, setLeaveSent] = useState(false);

  // Get player ID from local storage
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('playerId');
    if (storedPlayerId) {
      setCurrentPlayerId(storedPlayerId);
    } else {
      navigate('/');
    }
  }, [navigate]);

  const ws = useWebSocket((event: LobbyEvent) => {
    console.log('Received WebSocket event:', event);
    switch (event.type) {
      case 'player_join':
        setPlayers(prevPlayers => {
          const newPlayer = normalizePlayer(event.data.player);
          
          // Check if player already exists
          const playerExists = prevPlayers.some((p: Player) => p.id === newPlayer.id);
          if (playerExists) {
            return prevPlayers; // Don't add duplicate player
          }
          
          const newPlayers = [...prevPlayers, newPlayer];
          // Update host status when players change
          const isCurrentPlayerHost = newPlayers.some((p: Player) => p.id === currentPlayerId && p.is_host);
          setIsHost(isCurrentPlayerHost);
          return newPlayers;
        });
        break;
      case 'player_leave':
        setPlayers(prevPlayers => {
          const newPlayers = prevPlayers.filter((p: Player) => p.id !== event.data.playerId);
          // Update host status when players change
          const isCurrentPlayerHost = newPlayers.some((p: Player) => p.id === currentPlayerId && p.is_host);
          setIsHost(isCurrentPlayerHost);
          return newPlayers;
        });
        break;
      case 'host_change':
        setPlayers(prevPlayers => {
          return prevPlayers.map((player: Player) => ({
            ...player,
            is_host: player.id === event.data.newHostId
          }));
        });
        setIsHost(currentPlayerId === event.data.newHostId);
        break;
      case 'settings_update':
        setSettings(prevSettings => ({
          ...prevSettings,
          ...event.data.settings
        }));
        break;
      case 'player_rename':
        setPlayers(prevPlayers => {
          return prevPlayers.map(player => 
            player.id === event.data.playerId 
              ? { ...player, pseudo: event.data.newName }
              : player
          );
        });
        break;
      case 'profile_picture_change':
        setPlayers(prevPlayers => {
          return prevPlayers.map(player => 
            player.id === event.data.playerId 
              ? { 
                  ...player, 
                  profilePicture: event.data.pictureUrl,
                  pp_color: event.data.pp_color || player.pp_color || '#FFAD80' 
                }
              : player
          );
        });
        break;
      case 'game_start':
        console.log('Received game_start event:', event);
        // Store the game ID before navigating
        if (event.data.gameId) {
          console.log('Setting game ID:', event.data.gameId);
          Storage.setGameId(event.data.gameId);
          
          // Verify storage is set before navigating
          const storedGameId = Storage.getGameId();
          const storedPlayerId = Storage.getPlayerId();
          console.log('Stored game ID:', storedGameId);
          console.log('Stored player ID:', storedPlayerId);
          
          if (storedGameId) {
            // Add a small delay to ensure storage is properly set
            setTimeout(() => {
              navigate(`/game/${gameCode}`);
            }, 300);
          } else {
            console.error('Failed to store game ID');
            // Try one more time with a longer delay
            setTimeout(() => {
              Storage.setGameId(event.data.gameId);
              const retryStoredGameId = Storage.getGameId();
              console.log('Retry stored game ID:', retryStoredGameId);
              if (retryStoredGameId) {
                navigate(`/game/${gameCode}`);
              } else {
                console.error('Failed to store game ID after retry');
                alert('Failed to start the game. Please try again.');
              }
            }, 500);
          }
        } else {
          console.error('No game ID received in game_start event');
          alert('Failed to start the game. No game ID received.');
        }
        break;
    }
  });

  // Function to safely send a leave event only once
  const sendLeaveEvent = useCallback(() => {
    if (gameCode && currentPlayerId && !leaveSent) {
      // Check if we just joined (within the last 3 seconds)
      const joinTimestampStr = sessionStorage.getItem(`join_${gameCode}_${currentPlayerId}`);
      if (joinTimestampStr) {
        const joinTimestamp = parseInt(joinTimestampStr, 10);
        const now = Date.now();
        
        // If we joined less than 3 seconds ago, don't send a leave event
        if (now - joinTimestamp < 3000) {
          console.log(`Preventing leave event shortly after joining (${(now - joinTimestamp)/1000}s). Skipping leave event.`);
          return;
        }
      }
      
      console.log(`Sending leave event for player ${currentPlayerId} in lobby ${gameCode}`);
      ws.sendEvent({
        type: 'player_leave',
        data: {
          gameCode,
          playerId: currentPlayerId
        }
      });
      
      // Mark that we've sent a leave event
      setLeaveSent(true);
    }
  }, [gameCode, currentPlayerId, leaveSent, ws]);

  // Handle navigation events, but don't send leave events on page unload
  useEffect(() => {
    // We don't need to handle beforeunload anymore
    // The WebSocket connection will stay alive during page refreshes
    
    // Cleanup function for component unmount
    return () => {
      // Only send leave event when component unmounts due to navigation to a different page
      // Don't send if we're just refreshing or if we're navigating to the game page
      if (gameCode && currentPlayerId) {
        const currentPath = window.location.pathname;
        const isNavigatingToGame = currentPath.includes('/game/');
        
        // Only send leave event if we're not navigating to the game page
        if (!isNavigatingToGame) {
          sendLeaveEvent();
        }
      }
    };
  }, [gameCode, currentPlayerId, sendLeaveEvent]);

  useEffect(() => {
    // Fetch initial lobby data
    const fetchLobbyData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5000/games/lobby/${gameCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch lobby data');
        }
        
        const data = await response.json();
        console.log('Lobby data received:', data);
        
        // Normalize all players
        const normalizedPlayers = (data.players || []).map(normalizePlayer);
        setPlayers(normalizedPlayers);
        
        // Ensure visibility is private by default if not set
        const settings = data.settings || {
          max_players: null,
          time_limit: null,
          articles_number: 5,
          visibility: "private",
          allow_join: true
        };
        
        // Force visibility to private if not set
        if (!settings.visibility) {
          settings.visibility = "private";
        }
        
        setSettings(settings);
        
        // Check if current user is host
        const isCurrentPlayerHost = normalizedPlayers.some((p: { id: string; is_host: any; }) => p.id === currentPlayerId && p.is_host);
        setIsHost(isCurrentPlayerHost);

        // Store join timestamp to prevent immediate leave events
        const joinTimestamp = Date.now();
        sessionStorage.setItem(`join_${gameCode}_${currentPlayerId}`, joinTimestamp.toString());
        
        // Reset leave sent flag when joining
        setLeaveSent(false);
        setHasJoined(true);

        // Send join event through WebSocket
        const currentPlayer = normalizedPlayers.find((p: { id: string; }) => p.id === currentPlayerId);
        if (currentPlayer) {
          // Get stored profile picture and skin color
          const storedProfilePic = Storage.getProfilePicture();
          const storedProfilePicColor = Storage.getProfilePictureColor();
          
          // Update player data with stored values if available
          const playerData = { ...currentPlayer };
          if (storedProfilePic) {
            playerData.pp = storedProfilePic;
          }
          if (storedProfilePicColor) {
            playerData.pp_color = storedProfilePicColor;
          }
          
          ws.sendEvent({
            type: 'player_join',
            data: {
              gameCode,
              player: playerData
            }
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lobby data:', error);
        setError('Failed to load lobby data. Please try again.');
        setIsLoading(false);
      }
    };

    if (gameCode && currentPlayerId) {
      fetchLobbyData();
    }

    // Cleanup: leave the lobby when component unmounts
    return () => {
      if (gameCode && currentPlayerId && hasJoined) {
        sendLeaveEvent();
      }
    };
  }, [gameCode, currentPlayerId, ws, sendLeaveEvent, hasJoined]);

  const handleSettingsUpdate = (newSettings: LobbySettings) => {
    if (isHost && gameCode) {
      ws.sendEvent({
        type: 'settings_update',
        data: {
          gameCode,
          settings: newSettings
        }
      });
    }
  };

  const handleStartGame = () => {
    if (isHost && gameCode) {
      ws.sendEvent({
        type: 'game_start',
        data: { gameCode }
      });
    }
  };

  const handlePictureChange = (playerId: string, newPictureUrl: string, skinColor?: string) => {
    if (gameCode) {
      const finalSkinColor = skinColor || '#FFAD80';
      
      ws.sendEvent({
        type: 'profile_picture_change',
        data: {
          gameCode,
          playerId,
          pictureUrl: newPictureUrl,
          pp_color: finalSkinColor
        }
      });
      
      // Store the profile picture and skin color in localStorage if it's the current player
      if (playerId === currentPlayerId) {
        Storage.setProfilePicture(newPictureUrl);
        Storage.setProfilePictureColor(finalSkinColor);
        console.log(`Profile picture "${newPictureUrl}" and color "${finalSkinColor}" stored in localStorage`);
      }
    }
  };

  const handleRename = (playerId: string, newName: string) => {
    if (gameCode) {
      ws.sendEvent({
        type: 'player_rename',
        data: {
          gameCode,
          playerId,
          newName
        }
      });
      
      // Store the player name in localStorage if it's the current player
      if (playerId === currentPlayerId) {
        Storage.setPlayerName(newName);
        console.log(`Player name "${newName}" stored in localStorage`);
      }
    }
  };

  const artefacts: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"];

  const normalizePlayerId = (player: any): string => {
    if (typeof player.id === 'string') return player.id;
    if (typeof player.player_id === 'string') return player.player_id;
    if (player.player_id?._id) return player.player_id._id;
    if (player.player_id) return player.player_id.toString();
    return '';
  };

  const normalizePlayer = (player: any): Player => {
    const playerId = normalizePlayerId(player);
    const isCurrentPlayer = playerId === currentPlayerId;
    
    // Use stored player name for current player if available
    let playerName = player.pseudo || '';
    let profilePic = player.pp || '';
    let profilePicColor = player.pp_color || '#FFAD80';
    
    if (isCurrentPlayer) {
      // Handle player name
      const storedName = Storage.getPlayerName();
      if (storedName) {
        playerName = storedName;
      } else if (playerName) {
        // If we have a player name but it's not stored, store it
        Storage.setPlayerName(playerName);
      }
      
      // Handle profile picture
      const storedProfilePic = Storage.getProfilePicture();
      if (storedProfilePic) {
        profilePic = storedProfilePic;
      } else if (profilePic) {
        // If we have a profile picture but it's not stored, store it
        Storage.setProfilePicture(profilePic);
      }
      
      // Handle profile picture color
      const storedProfilePicColor = Storage.getProfilePictureColor();
      if (storedProfilePicColor) {
        profilePicColor = storedProfilePicColor;
      } else if (profilePicColor) {
        // If we have a profile picture color but it's not stored, store it
        Storage.setProfilePictureColor(profilePicColor);
      }
    }
    
    return {
      id: playerId,
      pseudo: playerName,
      pp: profilePic,
      pp_color: profilePicColor,
      is_host: !!player.is_host
    };
  };

  return (
    <>
      <div className="headerLobby">
        <Navbar />
      </div>
      <div className="lobbyContent">
        {error ? (
          <div className="error-message" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>
            {error}
          </div>
        ) : (
          <>
            <PlayerList
              players={players}
              currentPlayerId={currentPlayerId}
            />
            <div className={"GameInfo"}>
              <ArtefactsList artefacts={artefacts} />
              <OptionsPanel
                settings={settings}
                onSettingsUpdate={handleSettingsUpdate}
                isHost={isHost}
              />
              {isHost && <StartButton onStart={handleStartGame} />}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Lobby;