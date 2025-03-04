import React, {useEffect, useState} from "react";
import "../../style/game/WikiView.css";
import { postRequest } from "../../backend/services/apiService.js";
import {getApiUrl} from "../../utils/config";
import Actions from "./Actions.tsx";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

const WikiView: React.FC = () => {
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [wikiContent, setWikiContent] = useState<string>("");
  const [, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const navigate = useNavigate();

  // Get dynamic IDs from storage
  const gameId = Storage.getGameId();
  const playerId = Storage.getPlayerId();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1000;

    const checkCredentials = () => {
      const currentGameId = Storage.getGameId();
      const currentPlayerId = Storage.getPlayerId();

      console.log('Checking credentials (attempt ' + (retryCount + 1) + '/' + maxRetries + '):', {
        gameId: currentGameId || 'missing',
        playerId: currentPlayerId || 'missing',
        retryCount,
        localStorage: {
          gameId: localStorage.getItem('gameId'),
          playerId: localStorage.getItem('playerId'),
          gameCode: localStorage.getItem('gameCode')
        }
      });

      if (!currentGameId || !currentPlayerId) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying in ${retryInterval}ms...`);
          setTimeout(checkCredentials, retryInterval);
        } else {
          console.error("Failed to get credentials after retries:", {
            gameId: currentGameId || 'missing',
            playerId: currentPlayerId || 'missing',
            localStorage: {
              gameId: localStorage.getItem('gameId'),
              playerId: localStorage.getItem('playerId'),
              gameCode: localStorage.getItem('gameCode')
            }
          });
          navigate('/');
        }
        return;
      }

      console.log('Credentials found, initializing game with:', {
        gameId: currentGameId,
        playerId: currentPlayerId
      });

      // If we have both IDs, initialize the game
      initializeArticle();
    };

    const initializeArticle = async () => {
      try {
        const gameId = Storage.getGameId();
        const playerId = Storage.getPlayerId();

        if (!gameId || !playerId) {
          console.error("Missing credentials during initialization");
          return;
        }

        console.log('Initializing article for:', {
          gameId,
          playerId
        });

        // First try to get the current article from the game
        const currentArticle = await getCurrentArticle();
        console.log('Current article response:', currentArticle);

        if (currentArticle) {
          setCurrentTitle(currentArticle);
          fetchWikiContent(currentArticle);
        } else {
          console.log('No current article found, getting random article');
          // If no current article, get a random one
          const title = await getRandomWikipediaTitle();
          console.log('Got random title:', title);
          setCurrentTitle(title);
          await updateArticleInDB(title);
          fetchWikiContent(title);
        }
      } catch (error) {
        console.error("Error initializing article:", error);
      }
    };

    const blockBackNavigation = () => {
      window.history.pushState(null, "", window.location.href);
    };

    blockBackNavigation();
    window.addEventListener("popstate", blockBackNavigation);

    // Start the credential check process
    console.log('Starting credential check process');
    checkCredentials();

    return () => {
      window.removeEventListener("popstate", blockBackNavigation);
    };
  }, [navigate]);

  // Fonction pour notifier la base de données lors de chaque changement d'article
  const updateArticleInDB = async (title: string) => {
    try {
      const createdArticle = await postRequest(getApiUrl("/articles/create-article"), { title });

      if (createdArticle && createdArticle._id) {
        await postRequest(getApiUrl("/games/change"), {
          id_game: Storage.getGameId(),
          id_player: Storage.getPlayerId(),
          articleId: createdArticle._id,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'article dans la base de données :", error);
    }
  };

  const getCurrentArticle = async() => {
    try {
      const response = await postRequest(getApiUrl("/games/current-article"), {
        id_game: Storage.getGameId(),
        id_player: Storage.getPlayerId()
      });
      return response;
    } catch (e){
      console.error("Erreur lors du getCurrentArticle de wikiview : ", e);
      return null;
    }
  }

  const teleportArtifact = async () => {
    try {
      await postRequest(getApiUrl("/games/teleporter-artifact"), {id_game: gameId, id_player: playerId});
    } catch (e){
      console.error("Erreur lors du teleportArtifact de wikiview : ", e);
    }
  }

  const backArtifact = async () => {
    try {
      await postRequest(getApiUrl("/games/back-artifact"), {id_game: gameId, id_player: playerId});
    } catch (e){
      console.error("Erreur lors du backArtifact de wikiview : ", e);
    }
  }

  const eraserArtifact = async () => {
    try {
      await postRequest(getApiUrl("/games/eraser-artifact"), {id_game: gameId, id_player: playerId});
    } catch (e){
      console.error("Erreur lors du eraserArtifact de wikiview : ", e);
    }
  }

  const mineArtifact = async () => {
    try {
      await postRequest(getApiUrl("/games/mine-artifact"), {id_game: gameId, id_player: playerId});
    } catch (e){
      console.error("Erreur lors du mineArtifact de wikiview : ", e);
    }
  }

  const disorienterArtifact = async () => {
    try {
      await postRequest(getApiUrl("/games/disorienter-artifact"), {id_game: gameId, id_player: playerId});
    } catch (e){
      console.error("Erreur lors du disorienterArtifact de wikiview : ", e);
    }
  }


  const handleTeleportClick = async () => {
    await teleportArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
    }
  };

  const handleBackClick = async () => {
    await backArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
    }
  };

  const handleEraserClick = async () => {
    await eraserArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
    }
  };

  const handleMineClick = async () => {
    await mineArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
    }
  };

  const handleDisorienterClick = async () => {
    await disorienterArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
    }
  };

  const handleSnailClick = async() => {
    setIsBlocked(true);
    setTimeout(() => {
      setIsBlocked(false);
    }, 10000);
  };

  async function getRandomWikipediaTitle(): Promise<string> {
    const url = "https://fr.wikipedia.org/api/rest_v1/page/random/title";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const data = await response.json();
    return data.items[0].title;
  }

  async function fetchWikiContent(pageTitle: string) {
    setIsLoading(true);

    const url = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const html = await response.text();

      setWikiContent(html);

      setHistory((prevHistory) => {
        if (prevHistory[prevHistory.length - 1] !== pageTitle) {
          return [...prevHistory, pageTitle];
        }
        return prevHistory;
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu Wikipedia:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(isBlocked){
      event.preventDefault();
      alert("Les liens sont temporairement désactivés");
      return;
    }
    const link = (event.target as HTMLElement).closest("a");
    if (link && link.href.includes("/wiki/")) {
      event.preventDefault();
      const newTitle = decodeURIComponent(link.href.split("/wiki/")[1]);
      setCurrentTitle(newTitle);
      updateArticleInDB(newTitle);  // Création ici pour les nouveaux articles cliqués
    }
  };



  return (
      <div className="wiki-container">
        <h2 className="wiki-title">{currentTitle}</h2>

        <div className={`wiki-content ${isLoading ? "loading" : "fade-in"}`} onClick={handleLinkClick}>
          {isLoading ? (
              <div className="loading-spinner">Chargement...</div>
          ) : (
              <div dangerouslySetInnerHTML={{ __html: wikiContent }} />
          )}
        </div>

        {/* Intégration du composant Actions ici */}
        <Actions
            onTeleport={handleTeleportClick}
            onBack={handleBackClick}
            onEraser={handleEraserClick}
            onMine={handleMineClick}
            onDisorienter={handleDisorienterClick}
            onSnail={handleSnailClick}
        />
      </div>
  );
};

export default WikiView;
