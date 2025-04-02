import React, { useEffect, useState, useRef } from "react";
import "../../style/game/Players.css";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";
import nextArticle from "../../../public/assets/nextArticle.svg";
import closeChatbox from "../../../public/assets/closeChatbox.svg";

interface Player {
    id: number;
    pp: string;
    pseudo: string;
    score: number;
    pp_color?: string;
    articles_visited: string[];
}

const Players: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [articlesToFind, setArticlesToFind] = useState<string[]>([]);
    const [showPlayer, setShowPlayer] = useState<number | null>(null);
    const navigate = useNavigate();
    const isMounted = useRef(true); // Prevent memory leaks

    const fetchAllData = async () => {
        try {
            const gameId = Storage.getGameId();
            const playerId = Storage.getPlayerId();
            const playerName = Storage.getPlayerName();
            const profilePicture = Storage.getProfilePicture();
            const profilePictureColor = Storage.getProfilePictureColor();

            if (!gameId || !playerId) {
                console.error("Missing game ID or player ID");
                navigate("/");
                return;
            }

            // Fetch target articles
            const articlesData = await postRequest(getApiUrl("/games/target-articles"), { id_game: gameId });
            if (isMounted.current) setArticlesToFind(articlesData || []);

            // Fetch players
            const playersData = await postRequest(getApiUrl("/games/players"), { id_game: gameId });

            const updatedPlayers = playersData.map((player: Player) => ({
                ...player,
                pseudo: player.id.toString() === playerId ? playerName || player.pseudo : player.pseudo,
                pp: player.id.toString() === playerId ? profilePicture || player.pp : player.pp,
                pp_color: player.id.toString() === playerId ? profilePictureColor || player.pp_color : player.pp_color,
            }));

            if (isMounted.current) setPlayers(updatedPlayers);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchAllData();

        // Refresh every 3 seconds
        const interval = setInterval(fetchAllData, 3000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, [navigate]);

    return (
        <div className="players-container fade-in">
            <h2 className="players-title">Joueurs</h2>

            {showPlayer === null ? (
                // 🔹 Show list of players
                <ul className="players-list">
                    {players.map((player) => (
                        <div key={player.id}>
                            <li onClick={() => setShowPlayer(player.id)} className="player-item">
                                <img
                                    src={player.pp}
                                    alt=""
                                    className="ppGame"
                                    style={player.pp_color ? { backgroundColor: player.pp_color } : undefined}
                                />
                                - {player.pseudo} - {player.score}/{articlesToFind.length}
                            </li>
                            <hr />
                        </div>
                    ))}
                </ul>
            ) : (
                // 🔹 Show selected player details
                (() => {
                    const playerToShow = players.find((p) => p.id === showPlayer) || {
                        id: 0,
                        pp: "",
                        pseudo: "Unknown",
                        score: 0,
                        pp_color: "",
                        articles_visited: [],
                    };

                    return (
                        <div className="showPlayerInfo">
                            <img
                                src={playerToShow.pp}
                                alt=""
                                className="ppGame"
                                style={
                                    playerToShow.pp_color
                                        ? { backgroundColor: playerToShow.pp_color, width: "50px", height: "50px", marginTop: "10px" }
                                        : undefined
                                }
                            />
                            <p className="playerPseudo">{playerToShow.pseudo}</p>
                            <p className="playerScore">
                                {playerToShow.score}/{articlesToFind.length}
                            </p>
                            <p>Visited articles</p>

                            <div className="VisitedArticles">
                                {playerToShow.articles_visited.map((article, index) => (
                                    <div key={index}>
                                        <img src={nextArticle} alt="" />
                                        <p>{article}</p>
                                    </div>
                                ))}
                            </div>

                            <img
                                className="closeShowPlayer"
                                src={closeChatbox}
                                onClick={() => setShowPlayer(null)}
                                alt="X"
                                style={{ cursor: "pointer" }}
                            />
                        </div>
                    );
                })()
            )}
        </div>
    );
};

export default Players;
