import React, {useEffect, useState} from "react";
import '../../style/game/Actions.css';
import {postRequest} from "../../backend/services/apiService.js";
import {getApiUrl} from "../../utils/config";
import { Storage } from "../../utils/storage";

// 1. Définir les props attendues
interface ActionsProps {
    onTeleport: () => void,
    onBack: () => void,
    onEraser: () => void,
    onMine: () => void,
    onDisorienter: () => void,
    onSnail: () => void
}

// 2. Récupérer les props en argument
const Actions: React.FC<ActionsProps> = ({onTeleport, onBack, onEraser, onMine, onDisorienter, onSnail}) => {
    console.log('Props reçues par Actions:', {onTeleport});
    const [artifacts, setArtifacts] = useState<string[]>([]);

    // Validate ObjectId format (24 character hex string)
    const isValidObjectId = (id: string | null): boolean => {
        if (!id) return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    };

    const fetchArtifacts = async () => {
        try {
            // Get the values again after potential updates
            const updatedGameId = Storage.getGameId();
            const updatedPlayerId = Storage.getPlayerId();
            
            console.log("Fetching artifacts with IDs:", { gameId: updatedGameId, playerId: updatedPlayerId });
            
            if (!updatedGameId || !updatedPlayerId || !isValidObjectId(updatedGameId) || !isValidObjectId(updatedPlayerId)) {
                console.error("Missing or invalid IDs for artifacts fetch");
                return;
            }
            
            try {
                console.log("Making artifacts request to:", getApiUrl('/games/artifacts'));
                const data = await postRequest(getApiUrl('/games/artifacts'), {
                    id_game: updatedGameId,
                    id_player: updatedPlayerId
                });
                console.log("Fetched artifacts:", data);
                setArtifacts(data || []);
            } catch (artifactsError) {
                console.error("Error in artifacts request:", artifactsError);
                
                // Check if the error is "Player not found in this game"
                if (artifactsError instanceof Error && artifactsError.message.includes("Player not found in this game")) {
                    console.log("Attempting to join the game...");
                    try {
                        // Try to join the game
                        const gameCode = Storage.getGameCode();
                        if (gameCode && updatedPlayerId) {
                            await postRequest(getApiUrl('/games/join'), {
                                gameCode: gameCode,
                                playerId: updatedPlayerId
                            });
                            console.log("Successfully joined the game, retrying fetch...");
                            
                            // Retry fetching artifacts
                            const retryData = await postRequest(getApiUrl('/games/artifacts'), {
                                id_game: updatedGameId,
                                id_player: updatedPlayerId
                            });
                            setArtifacts(retryData || []);
                        }
                    } catch (joinError) {
                        console.error("Error joining the game:", joinError);
                        setArtifacts([]);
                    }
                } else {
                    setArtifacts([]);
                }
            }
        } catch (error) {
            console.error("Error in fetchArtifacts:", error);
            setArtifacts([]);
        }
    };

    useEffect(() => {
        fetchArtifacts();
    }, []);

    return (
        <div className="actions-container fade-in">
            {artifacts.map((artifact, index) => (
                <React.Fragment key={index}>
                    {/* 3. Appeler onTeleport quand on clique sur le bouton correspondant */}
                    <button
                        className="action-button mine-button"
                        id={artifact}
                        onClick={() => {
                            if (artifact === "Teleporter") {
                                onTeleport();
                            } else if (artifact === "Backtrack") {
                                onBack();
                            } else if (artifact === "Eraser") {
                                onEraser();
                            } else if (artifact === "Mine") {
                                onMine();
                            } else if (artifact === "Disorienter") {
                                onDisorienter();
                            } else if(artifact === "Snail") {
                                onSnail();
                            }
                        }}
                    >
                        {artifact}
                    </button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Actions;
