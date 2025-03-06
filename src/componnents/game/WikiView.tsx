import React, {useEffect, useState} from "react";
import "../../style/game/WikiView.css";
import { postRequest } from "../../backend/services/apiService.js";
import {getApiUrl} from "../../utils/config";
import Actions from "./Actions.tsx";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const WikiView: React.FC = () => {
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [wikiContent, setWikiContent] = useState<string>("");
  const [, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [initializationAttempted, setInitializationAttempted] = useState<boolean>(false);
  const navigate = useNavigate();

  // Get dynamic IDs from storage
  const gameId = Storage.getGameId();
  const playerId = Storage.getPlayerId();

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 5;
    const retryInterval = 1000;
    let retryTimer: number | null = null;

    // Validate ObjectId format (24 character hex string)
    const isValidObjectId = (id: string | null): boolean => {
      if (!id) return false;
      return /^[0-9a-fA-F]{24}$/.test(id);
    };

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

      if (!currentGameId || !currentPlayerId || !isValidObjectId(currentGameId) || !isValidObjectId(currentPlayerId)) {
        // Try to get valid IDs from localStorage directly
        const localGameId = localStorage.getItem('gameId');
        const localPlayerId = localStorage.getItem('playerId');
        
        if (isValidObjectId(localGameId) && isValidObjectId(localPlayerId) && localGameId && localPlayerId) {
          console.log("Using localStorage values directly:", { localGameId, localPlayerId });
          Storage.setGameId(localGameId);
          Storage.setPlayerId(localPlayerId);
          // Continue with initialization
          initializeArticle();
          return;
        }
        
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying in ${retryInterval}ms...`);
          retryTimer = window.setTimeout(checkCredentials, retryInterval);
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
      setInitializationAttempted(true);
      try {
        const gameId = Storage.getGameId() || undefined;
        const gameCode = Storage.getGameCode() || undefined;
        const playerId = Storage.getPlayerId();

        // Validate IDs
        if ((!gameId && !gameCode) || !playerId) {
          console.error("Missing credentials during initialization");
          toast.error("Missing game or player information");
          navigate('/');
          return;
        }

        // Ensure player ID is a valid MongoDB ObjectId (24 character hex string)
        if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
          console.error("Invalid player ID format:", { playerId });
          toast.error("Invalid player ID. Redirecting to home...");
          Storage.clear();
          navigate('/');
          return;
        }

        // We'll use either gameId or gameCode, with preference for gameId
        const gameIdentifier = gameId || gameCode;

        console.log('Initializing article for:', {
          gameIdentifier,
          playerId
        });

        // First try to get the current article from the game
        const currentArticle = await getCurrentArticle(gameIdentifier);
        console.log('Current article response:', currentArticle);

        if (currentArticle) {
          setCurrentTitle(currentArticle);
          await fetchWikiContent(currentArticle);
        } else {
          console.log('No current article found, getting random article');
          // If no current article, get a random one
          const title = await getRandomWikipediaTitle();
          console.log('Got random title:', title);
          setCurrentTitle(title);
          await updateArticleInDB(title, gameIdentifier);
          await fetchWikiContent(title);
        }
      } catch (error) {
        console.error("Error initializing article:", error);
      } finally {
        setIsLoading(false);
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
      if (retryTimer !== null) {
        window.clearTimeout(retryTimer);
      }
    };
  }, [navigate]);

  // Fonction pour notifier la base de données lors de chaque changement d'article
  const updateArticleInDB = async (title: string, gameIdentifier?: string) => {
    try {
      const gameId = gameIdentifier || Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      // Validate IDs
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in updateArticleInDB");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in updateArticleInDB:", { playerId });
        return;
      }
      
      console.log(`Creating article with title: ${title}`);
      const createdArticle = await postRequest(getApiUrl("/articles/create-article"), { title });

      if (createdArticle && createdArticle._id) {
        console.log(`Article created with ID: ${createdArticle._id}, updating player's current article`);
        const response = await postRequest(getApiUrl("/games/change-article"), {
          id_game: gameParam,
          id_player: playerId,
          articleId: createdArticle._id,
        });
        
        console.log("Article change response:", response);
        
        // Check if this is a target article and provide feedback
        if (response && response.isTargetArticle) {
          // Show a congratulatory message for finding a target article
          alert(`Félicitations! Vous avez trouvé un article cible: ${title}`);
        }
        
        // Dispatch a custom event to notify that articles have been updated
        const articleUpdateEvent = new CustomEvent('articleUpdated', {
          detail: {
            title: title,
            articleId: createdArticle._id,
            playerId: playerId,
            gameId: gameParam,
            isNewVisit: response?.isNewVisit || false,
            isTargetArticle: response?.isTargetArticle || false
          }
        });
        window.dispatchEvent(articleUpdateEvent);
        
        return response;
      } else {
        console.error("Failed to create article or get article ID");
      }
    } catch (error) {
      console.error("Error updating article in database:", error);
      throw error; // Rethrow to allow handling by caller
    }
  };

  const getCurrentArticle = async(gameIdentifier?: string) => {
    try {
      const gameParam = gameIdentifier || Storage.getGameId();
      const playerId = Storage.getPlayerId();
      
      console.log("Getting current article with IDs:", { gameId: gameParam, playerId });
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID or player ID in getCurrentArticle");
        return null;
      }
      
      console.log("Sending current-article request with:", { gameParam, playerId });
      
      try {
        const response = await postRequest(getApiUrl("/games/current-article"), {
          id_game: gameParam,
          id_player: playerId
        });
        
        console.log("Current article response:", response);
        return response;
      } catch (requestError) {
        console.error("Error in current-article request:", requestError);
        
        // Check if the error is "Player not found in this game"
        if (requestError instanceof Error && requestError.message.includes("Player not found in this game")) {
          console.log("Attempting to join the game...");
          try {
            // Try to join the game
            const gameCode = Storage.getGameCode();
            if (gameCode && playerId) {
              await postRequest(getApiUrl('/games/join'), {
                gameCode: gameCode,
                playerId: playerId
              });
              console.log("Successfully joined the game, retrying fetch...");
              
              // Retry fetching current article
              const retryResponse = await postRequest(getApiUrl("/games/current-article"), {
                id_game: gameParam,
                id_player: playerId
              });
              return retryResponse;
            }
          } catch (joinError) {
            console.error("Error joining the game:", joinError);
            return null;
          }
        }
        
        return null;
      }
    } catch (e){
      console.error("Error in getCurrentArticle:", e);
      return null;
    }
  };

  // Helper function for ObjectId validation
  const isValidObjectId = (id: string | null): boolean => {
    if (!id) return false;
    return /^[0-9a-fA-F]{24}$/.test(id);
  };

  const teleportArtifact = async () => {
    try {
      const gameId = Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in teleportArtifact");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in teleportArtifact:", { playerId });
        return;
      }
      
      const response = await postRequest(getApiUrl("/games/teleporter-artifact"), {
        id_game: gameParam,
        id_player: playerId
      });
      
      if (response && response.title) {
        setCurrentTitle(response.title);
        await fetchWikiContent(response.title);
      }
    } catch (error) {
      console.error("Error in teleportArtifact:", error);
    }
  };

  const backArtifact = async () => {
    try {
      const gameId = Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in backArtifact");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in backArtifact:", { playerId });
        return;
      }
      
      const response = await postRequest(getApiUrl("/games/back-artifact"), {
        id_game: gameParam,
        id_player: playerId
      });
      
      if (response && response.title) {
        setCurrentTitle(response.title);
        await fetchWikiContent(response.title);
      }
    } catch (error) {
      console.error("Error in backArtifact:", error);
    }
  };

  const eraserArtifact = async () => {
    try {
      const gameId = Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in eraserArtifact");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in eraserArtifact:", { playerId });
        return;
      }
      
      const response = await postRequest(getApiUrl("/games/eraser-artifact"), {
        id_game: gameParam,
        id_player: playerId
      });
      
      if (response && response.title) {
        setCurrentTitle(response.title);
        await fetchWikiContent(response.title);
      }
    } catch (error) {
      console.error("Error in eraserArtifact:", error);
    }
  };

  const mineArtifact = async () => {
    try {
      const gameId = Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in mineArtifact");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in mineArtifact:", { playerId });
        return;
      }
      
      const response = await postRequest(getApiUrl("/games/mine-artifact"), {
        id_game: gameParam,
        id_player: playerId
      });
      
      if (response && response.title) {
        setCurrentTitle(response.title);
        await fetchWikiContent(response.title);
      }
    } catch (error) {
      console.error("Error in mineArtifact:", error);
    }
  };

  const disorienterArtifact = async () => {
    try {
      const gameId = Storage.getGameId() || undefined;
      const gameCode = Storage.getGameCode() || undefined;
      const playerId = Storage.getPlayerId();
      
      // Use either gameId or gameCode
      const gameParam = gameId || gameCode;
      
      if (!gameParam || !playerId) {
        console.error("Missing game ID/code or player ID in disorienterArtifact");
        return;
      }
      
      // Ensure player ID is a valid MongoDB ObjectId
      if (!/^[0-9a-fA-F]{24}$/.test(playerId)) {
        console.error("Invalid player ID format in disorienterArtifact:", { playerId });
        return;
      }
      
      const response = await postRequest(getApiUrl("/games/disorienter-artifact"), {
        id_game: gameParam,
        id_player: playerId
      });
      
      if (response && response.title) {
        setCurrentTitle(response.title);
        await fetchWikiContent(response.title);
      }
    } catch (error) {
      console.error("Error in disorienterArtifact:", error);
    }
  };

  const handleTeleportClick = async () => {
    await teleportArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
      await fetchWikiContent(newTitle);
    }
  };

  const handleBackClick = async () => {
    await backArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
      await fetchWikiContent(newTitle);
    }
  };

  const handleEraserClick = async () => {
    await eraserArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
      await fetchWikiContent(newTitle);
    }
  };

  const handleMineClick = async () => {
    await mineArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
      await fetchWikiContent(newTitle);
    }
  };

  const handleDisorienterClick = async () => {
    await disorienterArtifact();
    const newTitle = await getCurrentArticle();
    if (newTitle) {
      setCurrentTitle(newTitle);
      await fetchWikiContent(newTitle);
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

  async function fetchWikiContent(pageTitle: string): Promise<void> {
    setIsLoading(true);

    const url = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    try {
      console.log(`Fetching Wikipedia content for: ${pageTitle}`);
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorMessage = `HTTP Error: ${response.status} - ${response.statusText}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      const html = await response.text();
      console.log(`Successfully fetched content for: ${pageTitle}`);

      setWikiContent(html);

      // Update history if this is a new page
      setHistory((prevHistory) => {
        if (prevHistory.length === 0 || prevHistory[prevHistory.length - 1] !== pageTitle) {
          console.log(`Adding ${pageTitle} to navigation history`);
          return [...prevHistory, pageTitle];
        }
        return prevHistory;
      });
    } catch (error) {
      console.error("Error fetching Wikipedia content:", error);
      setWikiContent(`<div class="error-message">Failed to load article: ${pageTitle}. Please try again.</div>`);
      throw error; // Rethrow to allow handling by caller
    } finally {
      setIsLoading(false);
    }
  }

  const handleLinkClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if(isBlocked){
      event.preventDefault();
      alert("Les liens sont temporairement désactivés");
      return;
    }
    
    const link = (event.target as HTMLElement).closest("a");
    if (link && link.href.includes("/wiki/")) {
      event.preventDefault();
      
      try {
        const newTitle = decodeURIComponent(link.href.split("/wiki/")[1]);
        console.log(`Link clicked: ${newTitle}`);
        
        // Update UI immediately
        setCurrentTitle(newTitle);
        setIsLoading(true);
        
        // Start fetching content
        const contentPromise = fetchWikiContent(newTitle);
        
        // Update the database in parallel
        try {
          await updateArticleInDB(newTitle);
          console.log(`Successfully updated article in database: ${newTitle}`);
        } catch (dbError) {
          console.error(`Failed to update article in database: ${newTitle}`, dbError);
          // Continue with content display even if DB update fails
        }
        
        // Wait for content to finish loading
        await contentPromise;
      } catch (error) {
        console.error("Error handling link click:", error);
        setIsLoading(false);
        // Show error message to user
        alert("Une erreur s'est produite lors du chargement de l'article. Veuillez réessayer.");
      }
    }
  };

  return (
      <div className="wiki-container">
        <h2 className="wiki-title">{currentTitle}</h2>

        <div className={`wiki-content ${isLoading ? "loading" : "fade-in"}`} onClick={handleLinkClick}>
          {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner-container">
                  <div className="loading-spinner-circle"></div>
                </div>
                <div className="loading-text">Chargement de la page...</div>
              </div>
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
