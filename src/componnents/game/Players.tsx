import React, { useEffect, useState } from "react";
import '../../style/game/Players.css';
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { Storage } from "../../utils/storage";
import { useNavigate } from "react-router-dom";

// Définir un type pour les joueurs
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
    const navigate = useNavigate();

    // Validate ObjectId format (24 character hex string)
    const isValidObjectId = (id: string | null): boolean => {
        if (!id) return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    useEffect(() => {
        // Get dynamic IDs from storage
        const gameId = Storage.getGameId();
        const playerId = Storage.getPlayerId();
        const playerName = Storage.getPlayerName();
        const profilePicture = Storage.getProfilePicture();
        const profilePictureColor = Storage.getProfilePictureColor();
        
        // Redirect to home if no game ID or player ID
        if (!gameId || !playerId) {
            console.error("Missing game ID or player ID in Players component");
            navigate('/');
            return;
        }
        
        // Validate ObjectIds
        if (!isValidObjectId(gameId) || !isValidObjectId(playerId)) {
            console.error("Invalid ObjectId format in Players component:", { gameId, playerId });
            
            // Try to get valid IDs from localStorage directly
            const localGameId = localStorage.getItem('gameId');
            const localPlayerId = localStorage.getItem('playerId');
            
            if (isValidObjectId(localGameId) && isValidObjectId(localPlayerId) && localGameId && localPlayerId) {
                console.log("Using localStorage values directly:", { localGameId, localPlayerId });
                Storage.setGameId(localGameId);
                Storage.setPlayerId(localPlayerId);
            } else {
                console.error("No valid IDs found in localStorage either");
                navigate('/');
                return;
            }
        }

        const fetchPlayers = async () => {
            try {
                // Get the values again after potential updates
                const updatedGameId = Storage.getGameId();
                
                if (!updatedGameId || !isValidObjectId(updatedGameId)) {
                    console.error("Still missing valid game ID after attempted fix");
                    return;
                }
                
                const data = await postRequest(getApiUrl('/games/players'), {
                    id_game: updatedGameId
                });
                
                // Update the current player's information with stored values
                const updatedPlayers = data.map((player: Player) => {
                    if (player.id.toString() === playerId) {
                        const updatedPlayer = { ...player };
                        
                        // Update name if stored
                        if (playerName) {
                            updatedPlayer.pseudo = playerName;
                        }
                        
                        // Update profile picture if stored
                        if (profilePicture) {
                            updatedPlayer.pp = profilePicture;
                        }
                        
                        // Update profile picture color if stored
                        if (profilePictureColor) {
                            updatedPlayer.pp_color = profilePictureColor;
                        }
                        
                        return updatedPlayer;
                    }
                    return player;
                });
                
                setPlayers(updatedPlayers || []);
            } catch (error) {
                console.error("Error fetching players:", error);
                setPlayers([]);
            }
        };

        const fetchTargetArticles = async () => {
            try {
                // Get the values again after potential updates
                const updatedGameId = Storage.getGameId();
                
                if (!updatedGameId || !isValidObjectId(updatedGameId)) {
                    console.error("Still missing valid game ID after attempted fix");
                    return;
                }
                
                const data = await postRequest(getApiUrl('/games/target-articles'), {
                    id_game: updatedGameId
                });
                setArticlesToFind(data || []);
            } catch (error) {
                console.error("Error fetching target articles:", error);
                setArticlesToFind([]);
            }
        };

        fetchPlayers();
        fetchTargetArticles();
    }, [navigate]);

    return (
        <div className="players-container fade-in">
            <h2 className="players-title">Joueurs</h2>
            <ul className="players-list">
                {players.map((player, index) => (
                    <div key={index}>
                        <li className="player-item">
                            <img 
                                src={player.pp} 
                                alt="" 
                                className="ppGame"
                                style={player.pp_color ? { backgroundColor: player.pp_color } : undefined}
                            /> - {player.pseudo} - {player.score}/{articlesToFind.length}
                        </li>
                        <hr />
                    </div>
                ))}
            </ul>
        </div>
    );
};

export default Players;