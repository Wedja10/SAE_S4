import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import { PlayerList } from "../componnents/lobby/LobbyComponents.tsx";
import { ArtefactsList, OptionsPanel, StartButton } from "../componnents/lobby/Artefacts.tsx";
import { useEffect, useState } from "react";
import { useWebSocket, type LobbyEvent } from "../services/WebSocketService";
import { useParams, useNavigate } from "react-router-dom";
import { Storage, StorageKeys } from "../utils/storage";

interface LobbySettings {
  max_players: number | null;
  time_limit: number | null;
  articles_number: number;
  visibility: string;
  allow_join: boolean;
}

const Lobby: React.FC = () => {
  const [players, setPlayers] = useState<Array<{ id: string; pseudo: string; pp: string; is_host: boolean }>>([]);
  const [settings, setSettings] = useState<LobbySettings>({
    max_players: null,
    time_limit: null,
    articles_number: 5,
    visibility: "public",
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

  const ws = useWebSocket((event: LobbyEvent) => {
    console.log('Received WebSocket event:', event);
    switch (event.type) {
      case 'player_join':
        setPlayers(prevPlayers => {
          // Make sure the player has the correct structure
          const newPlayer = event.data.player;
          if (!newPlayer.id && newPlayer.player_id) {
            newPlayer.id = typeof newPlayer.player_id === 'string' ? newPlayer.player_id : newPlayer.player_id.toString();
          }
          
          const newPlayers = [...prevPlayers, newPlayer];
          // Update host status when players change
          const isCurrentPlayerHost = newPlayers.some(p => p.id === currentPlayerId && p.is_host);
          setIsHost(isCurrentPlayerHost);
          return newPlayers;
        });
        break;
      case 'player_leave':
        setPlayers(prevPlayers => {
          const newPlayers = prevPlayers.filter(p => p.id !== event.data.playerId);
          // Update host status when players change
          const isCurrentPlayerHost = newPlayers.some(p => p.id === currentPlayerId && p.is_host);
          setIsHost(isCurrentPlayerHost);
          return newPlayers;
        });
        break;
      case 'settings_update':
        console.log('Received settings update:', event.data.settings);
        setSettings(prevSettings => {
          const newSettings = {
            ...prevSettings,
            ...event.data.settings
          };
          console.log('Updated settings:', newSettings);
          return newSettings;
        });
        break;
      case 'game_start':
        navigate(`/game/${gameCode}`);
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
        console.log('Current player ID:', currentPlayerId);
        setPlayers(data.players || []);
        setSettings(data.settings || {
          max_players: null,
          time_limit: null,
          articles_number: 5,
          visibility: "public",
          allow_join: true
        });
        
        // Check if current user is host
        console.log('Players from API:', data.players);
        const isCurrentPlayerHost = (data.players || []).some(
          (p: any) => {
            console.log('Checking player:', p);
            // Check both id and player_id fields
            const matchesId = p.id === currentPlayerId || 
                             (p.player_id && (p.player_id === currentPlayerId || 
                                             p.player_id._id === currentPlayerId || 
                                             p.player_id.toString() === currentPlayerId));
            console.log('Matches ID:', matchesId, 'Is host:', p.is_host);
            return matchesId && p.is_host;
          }
        );
        console.log('Is current player host?', isCurrentPlayerHost);
        setIsHost(isCurrentPlayerHost);

        // Join the lobby via WebSocket
        ws.sendEvent({
          type: 'player_join',
          data: {
            gameCode,
            player: data.players?.find((p: { id: string }) => p.id === currentPlayerId)
          }
        });
      } catch (error) {
        console.error('Error fetching lobby data:', error);
        // Don't navigate away immediately, show error state
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
      console.log('Sending settings update:', newSettings);
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