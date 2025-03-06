import React, { useEffect, useState, useCallback, useRef } from "react";
import '../../style/game/Articles.css';
import "../../backend/services/apiService.js";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

const Articles: React.FC = () => {
    const [visitedArticles, setVisitedArticles] = useState<string[]>([]);
    const [articlesToFind, setArticlesToFind] = useState<string[]>([]);
    const [foundTargetArticles, setFoundTargetArticles] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [newArticle, setNewArticle] = useState<string | null>(null);
    const [newTargetFound, setNewTargetFound] = useState<string | null>(null);
    const previousVisitedRef = useRef<string[]>([]);
    const previousTargetsRef = useRef<string[]>([]);
    const navigate = useNavigate();

    // Validate ObjectId format (24 character hex string)
    const isValidObjectId = (id: string | null): boolean => {
        if (!id) return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    // Create a fetchData function that can be called multiple times
    const fetchData = useCallback(async () => {
        try {
            // Get the values from storage
            const gameId = Storage.getGameId();
            const playerId = Storage.getPlayerId();
            
            if (!gameId || !playerId || !isValidObjectId(gameId) || !isValidObjectId(playerId)) {
                console.error("Missing or invalid IDs:", { gameId, playerId });
                setError("Missing game or player information");
                return false;
            }
            
            let success = true;
            
            try {
                // Fetch target articles
                console.log("Fetching target articles...");
                const targetData = await postRequest(getApiUrl('/games/target-articles'), {
                    id_game: gameId
                });
                console.log("Target articles data:", targetData);
                setArticlesToFind(targetData || []);
                
                // Fetch found target articles
                console.log("Fetching found target articles...");
                const foundTargetData = await postRequest(getApiUrl('/games/found-target-articles'), {
                    id_game: gameId,
                    id_player: playerId
                });
                console.log("Found target articles data:", foundTargetData);
                
                // Check for newly found target articles
                const prevFoundTargets = previousTargetsRef.current;
                const newFoundTargets = foundTargetData || [];
                
                if (prevFoundTargets.length < newFoundTargets.length) {
                    const newTargets = newFoundTargets.filter((article: string) => !prevFoundTargets.includes(article));
                    if (newTargets.length > 0) {
                        console.log("New target article found:", newTargets[0]);
                        setNewTargetFound(newTargets[0]);
                        
                        // Clear the highlight after 3 seconds
                        setTimeout(() => {
                            setNewTargetFound(null);
                        }, 3000);
                    }
                }
                
                // Update the previous targets ref
                previousTargetsRef.current = newFoundTargets;
                setFoundTargetArticles(newFoundTargets);
            } catch (targetError) {
                console.error("Error fetching target articles:", targetError);
                setArticlesToFind([]);
                setFoundTargetArticles([]);
                success = false;
            }

            try {
                // Fetch visited articles
                console.log("Fetching visited articles...");
                const visitedData = await postRequest(getApiUrl('/games/articles'), {
                    id_game: gameId,
                    id_player: playerId
                });
                console.log("Visited articles data:", visitedData);
                
                // Check for new articles
                const prevVisited = previousVisitedRef.current;
                const newVisited = visitedData || [];
                
                // Find newly added articles
                if (prevVisited.length < newVisited.length) {
                    const newArticles = newVisited.filter((article: string) => !prevVisited.includes(article));
                    if (newArticles.length > 0) {
                        console.log("New article detected:", newArticles[0]);
                        setNewArticle(newArticles[0]);
                        
                        // Clear the new article highlight after 3 seconds
                        setTimeout(() => {
                            setNewArticle(null);
                        }, 3000);
                    }
                }
                
                // Update the previous visited ref
                previousVisitedRef.current = newVisited;
                setVisitedArticles(newVisited);
            } catch (visitedError) {
                console.error("Error fetching visited articles:", visitedError);
                
                // Check if the error is "Player not found in this game"
                if (visitedError instanceof Error && visitedError.message.includes("Player not found in this game")) {
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
                            
                            // Retry fetching visited articles
                            const retryVisitedData = await postRequest(getApiUrl('/games/articles'), {
                                id_game: gameId,
                                id_player: playerId
                            });
                            setVisitedArticles(retryVisitedData || []);
                            previousVisitedRef.current = retryVisitedData || [];
                        }
                    } catch (joinError) {
                        console.error("Error joining the game:", joinError);
                        setVisitedArticles([]);
                        success = false;
                    }
                } else {
                    setVisitedArticles([]);
                    success = false;
                }
            }
            
            setLoading(false);
            return success;
        } catch (error) {
            console.error('Error in fetchData:', error);
            setArticlesToFind([]);
            setVisitedArticles([]);
            setFoundTargetArticles([]);
            setLoading(false);
            setError("Failed to load articles");
            return false;
        }
    }, []);

    // Handle article update event
    const handleArticleUpdate = useCallback((event: CustomEvent) => {
        console.log("Article update event received:", event.detail);
        
        // If this is a target article, update immediately
        if (event.detail && event.detail.isTargetArticle) {
            console.log("Target article found, refreshing immediately");
            fetchData();
        } else {
            // For regular articles, just update the visited list
            fetchData();
        }
        
        // Set the new article for highlighting
        if (event.detail && event.detail.title) {
            setNewArticle(event.detail.title);
            
            // If this is a target article, highlight it in the target list
            if (event.detail.isTargetArticle) {
                setNewTargetFound(event.detail.title);
                
                // Clear the target highlight after 3 seconds
                setTimeout(() => {
                    setNewTargetFound(null);
                }, 3000);
            }
            
            // Clear the article highlight after 3 seconds
            setTimeout(() => {
                setNewArticle(null);
            }, 3000);
        }
    }, [fetchData]);

    useEffect(() => {
        // Initial fetch
        fetchData().then(success => {
            if (!success) {
                console.log("Initial fetch failed, will retry...");
            }
        });
        
        // Set up polling for real-time updates
        const intervalId = setInterval(() => {
            console.log("Polling for article updates...");
            fetchData().then(success => {
                if (!success) {
                    console.log("Polling fetch failed");
                }
            });
        }, 3000); // Poll every 3 seconds for more responsive updates
        
        // Add event listener for immediate updates when an article is visited
        window.addEventListener('articleUpdated', handleArticleUpdate as EventListener);
        
        // Clean up interval and event listener on component unmount
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('articleUpdated', handleArticleUpdate as EventListener);
        };
    }, [fetchData, handleArticleUpdate, navigate]);

    if (loading && visitedArticles.length === 0 && articlesToFind.length === 0) {
        return <div className="articles-container loading fade-in">Loading articles...</div>;
    }

    if (error) {
        return <div className="articles-container error fade-in">{error}</div>;
    }

    // Check if an article is found (in the foundTargetArticles list)
    const isArticleFound = (article: string) => {
        return foundTargetArticles.includes(article);
    };

    return (
        <div className="articles-container fade-in">
            <div>
                <h2 className="articles-title">Articles à Trouver</h2>
                <ul className="articles-list">
                    {articlesToFind.length > 0 ? (
                        articlesToFind.map((article, index) => (
                            <React.Fragment key={index}>
                                <li className={`article-item article-to-find ${isArticleFound(article) ? 'found' : ''} ${article === newTargetFound ? 'new' : ''}`}>
                                    {article}
                                    {isArticleFound(article) && <span className="found-indicator">✓</span>}
                                </li>
                                <hr />
                            </React.Fragment>
                        ))
                    ) : (
                        <li className="article-item empty">Aucun article cible trouvé</li>
                    )}
                </ul>
            </div>

            <div>
                <h2 className="articles-title">Articles Visités</h2>
                <ul className="articles-list">
                    {visitedArticles.length > 0 ? (
                        visitedArticles.map((article, index) => (
                            <React.Fragment key={index}>
                                <li className={`article-item article-visited ${article === newArticle ? 'new' : ''}`}>
                                    {article}
                                </li>
                                <hr />
                            </React.Fragment>
                        ))
                    ) : (
                        <li className="article-item empty">Aucun article visité</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Articles;
