import '../style/game/Game.css';
import Articles from "../componnents/game/Articles";
import WikiView from "../componnents/game/WikiView";
import Players from "../componnents/game/Players";
import Chat from "../componnents/game/Chat";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Storage } from "../utils/storage";

const Game: React.FC = () => {
  const { gameCode } = useParams<{ gameCode: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Ensure we have the necessary data to play the game
    const gameId = Storage.getGameId();
    const playerId = Storage.getPlayerId();
    const playerName = Storage.getPlayerName();
    const profilePicture = Storage.getProfilePicture();
    const profilePictureColor = Storage.getProfilePictureColor();
    
    console.log("Game component initialized with:", {
      gameId,
      playerId,
      gameCode,
      playerName,
      profilePicture,
      profilePictureColor,
      localStorage: {
        gameId: localStorage.getItem('gameId'),
        playerId: localStorage.getItem('playerId'),
        gameCode: localStorage.getItem('gameCode'),
        playerName: localStorage.getItem('playerName'),
        profilePicture: localStorage.getItem('profilePicture'),
        profilePictureColor: localStorage.getItem('profilePictureColor')
      }
    });
    
    if (!gameId || !playerId) {
      console.error("Missing game ID or player ID in Game component");
      alert("Game data is missing. Redirecting to home page.");
      navigate('/');
      return;
    }
    
    // Store the game code if it's available from the URL
    if (gameCode) {
      Storage.setGameCode(gameCode);
    }

    // Simulate loading time for the game initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameCode, navigate]);

  if (isLoading) {
    return (
      <div className="game-loading-screen">
        <div className="game-loading-content">
          <div className="game-loading-logo">WikiGame</div>
          <div className="game-loading-spinner-container">
            <div className="game-loading-spinner-circle"></div>
          </div>
          <div className="game-loading-text">Préparation de l'aventure...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* Sidebar gauche */}
      <aside className="sidebar-left">
        <Articles />
      </aside>

      {/* Contenu principal */}
      <main className="main-content">
        <WikiView />
      </main>

      {/* Sidebar droite */}
      <aside className="sidebar-right">
        <Players />
        <Chat />
      </aside>
    </div>
  );
};

export default Game;