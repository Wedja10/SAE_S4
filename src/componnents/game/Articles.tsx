import React, { useEffect, useState } from "react";
import '../../style/game/Articles.css';
import "../../backend/services/apiService.js";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

const Articles: React.FC = () => {
    const [visitedArticles, setVisitedArticles] = useState<string[]>([]);
    const [articlesToFind, setArticlesToFind] = useState<string[]>([]);
    const [setData] = useState<any>(null);
    const navigate = useNavigate();

    // Get dynamic IDs from storage
    const gameId = Storage.getGameId();
    const playerId = Storage.getPlayerId();

    useEffect(() => {
        // Redirect to home if no game ID or player ID
        if (!gameId || !playerId) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch target articles
                const targetData = await postRequest(getApiUrl('/games/target-articles'), {
                    id_game: gameId
                });
                setData(targetData);
                setArticlesToFind(targetData);

                // Fetch visited articles
                const visitedData = await postRequest(getApiUrl('/games/articles'), {
                    id_game: gameId,
                    id_player: playerId
                });
                setData(visitedData);
                setVisitedArticles(visitedData);
            } catch (error) {
                console.error('Error fetching articles:', error);
            }
        };

        fetchData();
    }, [gameId, playerId]);

    return (
        <div className="articles-container fade-in">
            <div>
                <h2 className="articles-title">Articles à Trouver</h2>
                <ul className="articles-list">
                    {articlesToFind.map((article, index) => (
                        <React.Fragment key={index}>
                            <li className="article-item article-to-find">{article}</li>
                            <hr />
                        </React.Fragment>
                    ))}
                </ul>
            </div>

            <div>
                <h2 className="articles-title">Articles Visités</h2>
                <ul className="articles-list">
                    {visitedArticles.map((article, index) => (
                        <React.Fragment key={index}>
                            <li className="article-item article-visited">{article}</li>
                            <hr />
                        </React.Fragment>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Articles;
