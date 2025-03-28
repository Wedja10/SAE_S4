import React, { useEffect, useState } from "react";
import '../../style/game/Players.css';
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
}

const Players: React.FC = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [articlesToFind, setArticlesToFind] = useState<string[]>([]);
    const [showPlayer, setShowPlayer] = useState(0);
    const navigate = useNavigate();

    const fetchAllData = async () => {
        try {
            const gameId = Storage.getGameId();
            const playerId = Storage.getPlayerId();
            const playerName = Storage.getPlayerName();
            const profilePicture = Storage.getProfilePicture();
            const profilePictureColor = Storage.getProfilePictureColor();

            if (!gameId || !playerId) {
                console.error("Missing game ID or player ID in Players component");
                navigate('/');
                return;
            }

            // Récupérer les articles cibles
            const articlesData = await postRequest(getApiUrl('/games/target-articles'), {
                id_game: gameId
            });
            setArticlesToFind(articlesData || []);

            // Récupérer les joueurs avec leurs scores
            const playersData = await postRequest(getApiUrl('/games/players'), {
                id_game: gameId
            });

            // Mettre à jour avec les données locales si nécessaire
            const updatedPlayers = playersData.map((player: Player) => {
                if (player.id.toString() === playerId) {
                    return {
                        ...player,
                        pseudo: playerName || player.pseudo,
                        pp: profilePicture || player.pp,
                        pp_color: profilePictureColor || player.pp_color
                    };
                }
                return player;
            });

            const playersWithScores = await Promise.all(
                updatedPlayers.map(async (player: Player) => {
                    const foundArticles = await postRequest(getApiUrl('/games/found-target-articles'), {
                        id_game: gameId,
                        id_player: player.id
                    });
                    return {
                        ...player,
                        score: foundArticles?.length || 0
                    };
                })
            );

            setPlayers(playersWithScores);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchAllData(); // Chargement initial

        // Mise à jour automatique toutes les 3 secondes
        const interval = setInterval(fetchAllData, 3000);

        return () => {
            clearInterval(interval);
        };
    }, [navigate]);

    function handlePlayerClick(player: Player) {
        setShowPlayer(player.id);
    }

    if (showPlayer === 0) {
        return (
            <div className="players-container fade-in">
                <h2 className="players-title">Joueurs</h2>
                <ul className="players-list">
                    {players.map((player, index) => (
                        <div key={index}>
                            <li onClick={() => handlePlayerClick(player)} className="player-item">
                                <img
                                    src={player.pp}
                                    alt=""
                                    className="ppGame"
                                    style={player.pp_color ? {backgroundColor: player.pp_color} : undefined}
                                /> - {player.pseudo} - {player.score}/{articlesToFind.length}
                            </li>
                            <hr/>
                        </div>
                    ))}
                </ul>
            </div>
        );
    } else {
        const playerToShow = players.find(player => player.id === showPlayer) || {
            pp: '',
            pseudo: '',
            score: 0,
            pp_color: ''
        };

        return (
            <div className="players-container fade-in">
                <h2 className="players-title">Joueurs</h2>
                <div className="showPlayerInfo">
                    <img
                        src={playerToShow.pp}
                        alt=""
                        className="ppGame"
                        style={playerToShow.pp_color ? {
                            backgroundColor: playerToShow.pp_color,
                            width: "50px",
                            height: "50px",
                            marginTop: "10px"
                        } : undefined}
                    />
                    <p className="playerPseudo">{playerToShow.pseudo}</p>
                    <p className="playerScore">{playerToShow.score}/{articlesToFind.length}</p>
                    <p>Visited articles</p>

                    <div className="VisitedArticles">
                        {articlesToFind.map((article, index) => (
                            <div key={index}>
                                <img src={nextArticle} alt=''/>
                                <p>{article}</p>
                            </div>
                        ))}
                    </div>

                    <img
                        className={'closeShowPlayer'}
                        src={closeChatbox}
                        onClick={() => setShowPlayer(0)}
                        alt='X'
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </div>
        );
    }
};

export default Players;