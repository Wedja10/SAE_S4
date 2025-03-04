import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import { PlayerList } from "../componnents/lobby/LobbyComponents.tsx";
import { ArtefactsList, OptionsPanel, StartButton } from "../componnents/lobby/Artefacts.tsx";
import { useEffect, useState } from "react";
import { useWebSocket, type LobbyEvent } from "../services/WebSocketService";
import { useParams, useNavigate } from "react-router-dom";
import { Storage } from "../utils/storage";

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
  is_host: boolean;
}

const Lobby: React.FC = () => {
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
  const { gameCode } = useParams();
  const navigate = useNavigate();
  const currentPlayerId = Storage.getPlayerId() || '';

  useEffect(() => {
    if (!currentPlayerId) {
      navigate('/choice');
      return;
    }
    if (gameCode) {
      Storage.setGameCode(gameCode);
    }
  }, [currentPlayerId, gameCode, navigate]);

  const artefacts: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"];

  const normalizePlayerId = (player: any): string => {
    if (typeof player.id === 'string') return player.id;
    if (typeof player.player_id === 'string') return player.player_id;
    if (player.player_id?._id) return player.player_id._id;
    if (player.player_id) return player.player_id.toString();
    return '';
  };

  const normalizePlayer = (player: any): Player => {
    return {
      id: normalizePlayerId(player),
      pseudo: player.pseudo || '',
      pp: player.pp || '',
      is_host: !!player.is_host
    };
  };

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
      case 'game_start':
        console.log('Received game_start event:', event);
        // Store the game ID before navigating
        if (event.data.gameId) {
          console.log('Setting game ID:', event.data.gameId);
          Storage.setGameId(event.data.gameId);
          // Small delay to ensure storage is set
          setTimeout(() => {
            const storedGameId = Storage.getGameId();
            console.log('Stored game ID:', storedGameId);
            if (storedGameId) {
              navigate(`/game/${gameCode}`);
            } else {
              console.error('Failed to store game ID');
            }
          }, 100);
        } else {
          console.error('No game ID received in game_start event');
        }
        break;
    }
  });

  useEffect(() => {
    // Fetch initial lobby data
    const fetchLobbyData = async () => {
      try {
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

        // Send join event through WebSocket
        const currentPlayer = normalizedPlayers.find((p: { id: string; }) => p.id === currentPlayerId);
        if (currentPlayer) {
          ws.sendEvent({
            type: 'player_join',
            data: {
              gameCode,
              player: currentPlayer
            }
          });
        }

      } catch (error) {
        console.error('Error fetching lobby data:', error);
        setError('Failed to load lobby data. Please try again.');
      }
    };

    if (gameCode && currentPlayerId) {
      fetchLobbyData();
    }

    // Cleanup: leave the lobby when component unmounts
    return () => {
      if (gameCode && currentPlayerId) {
        ws.sendEvent({
          type: 'player_leave',
          data: {
            gameCode,
            playerId: currentPlayerId
          }
        });
      }
    };
  }, [gameCode, currentPlayerId, ws]);

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