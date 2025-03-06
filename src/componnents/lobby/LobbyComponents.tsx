import Playerpicture from '/assets/playerPicture.png';
import chatIcon from '/assets/chatIcon.svg';
import { PlayerName } from './PlayerName';
import { useWebSocket } from '../../services/WebSocketService';
import { Storage } from '../../utils/storage';
import { useState, useEffect } from 'react';
import { ProfilePicture } from './ProfilePicture';
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
  const [currentPicture, setCurrentPicture] = useState(player.pp || Playerpicture);
  const [currentSkinColor, setCurrentSkinColor] = useState(player.pp_color || '#FFAD80');
  const gameCode = Storage.getGameCode();
  
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
      {currentUserId !== player.id && <ChatButton onClick={onChatClick} />}
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