import Playerpicture from '/assets/playerPicture.png';
import chatIcon from '/assets/chatIcon.svg';
import { PlayerName } from './PlayerName';
import { useWebSocket } from '../../services/WebSocketService';
import { Storage } from '../../utils/storage';
import { useState } from 'react';

interface PlayerProps {
  player: {
    id: string;
    pseudo: string;
    pp: string;
    is_host: boolean;
  };
  self: boolean;
  onChatClick: () => void;
}

interface ChatButtonProps {
  onClick: () => void;
}

export const ChatButton = ({ onClick }: ChatButtonProps) => {
  return (
    <button className="ChatButton" onClick={onClick}>
      <img src={chatIcon} alt="X" style={{ height: '20px' }} />
      <p>Chat</p>
    </button>
  );
};

export const Player = ({ player, onChatClick, self }: PlayerProps) => {
  const currentUserId = localStorage.getItem('playerId');

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
      {currentUserId !== player.id && <ChatButton onClick={onChatClick} />}
    </div>
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

  const [chatOpen, setChatOpen] = useState('');
  const [message, setMessage] = useState('');

  const handleChatClick = (playerName: string) => { // Gestion des clicks sur ChatButton ou sur CloseChatbox
    if (chatOpen === '') {
      setChatOpen(playerName);
    } else {
      setChatOpen('');
    }
  };

  const handleTypeMessage = () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    setMessage(document.querySelector('.textInput').value);
  };

  const handleSendMessage = () => {
    console.log('Message envoyé : ' + message);
  }

  if (chatOpen === '') { // Affichage de la liste des joueurs
    return (
      <div className="PlayerList">
        <div className="LobbyTitle fade-in">LOBBY</div>
        {players.map((player) => (
          <Player
            key={player.id}
            player={player}
            self={player.id === currentPlayerId}
            onChatClick={() => handleChatClick(player.pseudo)}
          />
        ))}
      </div>
    );
  } else { // Affichage de la boite de chat du joueur
    return (
      <div className="PrivateChatbox">
        <div className="ChatboxHeader">
          <img src={"/public/assets/closeChatbox.svg"} alt="X" onClick={() => handleChatClick('')} style={{
            cursor: 'pointer',
            height: '25px'
          }}/>
          <p>{chatOpen}</p>
        </div>
        <div className="ChatboxContent"></div>
        <div className="ChatboxInput">
          <input type="text" className="textInput" placeholder="Message..." onChange={handleTypeMessage} />
          <img src={"/public/assets/sendPlane.svg"} alt={"Send"} onClick={() => handleSendMessage()} style={{
            cursor: 'pointer',
            height: '25px'
          }} />
        </div>
      </div>
    );
  }
};