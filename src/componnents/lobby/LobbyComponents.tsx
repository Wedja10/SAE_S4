import Playerpicture from '/assets/playerPicture.png';
import chatIcon from '/assets/chatIcon.svg';
import { PlayerName } from './PlayerName';
import { useWebSocket } from '../../services/WebSocketService';
import { Storage } from '../../utils/storage';

interface PlayerProps {
  player: {
    id: string;
    pseudo: string;
    pp: string;
    is_host: boolean;
  };
  self: boolean;
}

export const Player = ({ player, self }: PlayerProps) => {
  const ws = useWebSocket(() => {});
  const gameCode = Storage.getGameCode();

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

  return (
    <div className="Player fade-in">
      <img
        className="playerPicture"
        src={player.pp || Playerpicture}
        alt={player.pseudo}
        style={{
          height: '50px',
          width: '50px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: player.is_host ? '2px solid #E09D2D' : '2px solid #FFFFFF'
        }}
      />
      <div className="player-info">
        <PlayerName
          name={player.pseudo}
          isCurrentPlayer={self}
          onRename={handleRename}
        />
        {player.is_host && <span className="host-badge">HOST</span>}
      </div>
      <ChatButton />
    </div>
  );
};

export const ChatButton = () => {
  return (
    <button className="ChatButton">
      <img src={chatIcon} alt="X" style={{ height: '20px' }} />
      <p>Chat</p>
    </button>
  );
};

interface PlayerListProps {
  players: Array<{
    id: string;
    pseudo: string;
    pp: string;
    is_host: boolean;
  }>;
  currentPlayerId?: string;
}

export const PlayerList = ({ players, currentPlayerId }: PlayerListProps) => {
  return (
    <div className="PlayerList">
      <div className="LobbyTitle fade-in">LOBBY</div>
      {players.map((player) => (
        <Player
          key={player.id}
          player={player}
          self={player.id === currentPlayerId}
        />
      ))}
    </div>
  );
};