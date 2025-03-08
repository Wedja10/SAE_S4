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
    const [artifacts, setArtifacts] = useState<{ [key: string]: number }>({});
    console.log('Props reçues par Actions:', {onTeleport});


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
                console.log("Making artifacts request to:", getApiUrl('/games/storable-artifacts'));
                const data = await postRequest(getApiUrl('/games/storable-artifacts'), {
                    id_game: updatedGameId,
                    id_player: updatedPlayerId
                });
                console.log("Fetched artifacts:", data);
                if (Array.isArray(data)) {
                    const formattedArtifacts = data.reduce((acc, artifact) => {
                        acc[artifact] = (acc[artifact] || 0) + 1;
                        return acc;
                    }, {} as { [key: string]: number });

                    setArtifacts(formattedArtifacts);
                    console.log("Formatted artifacts:", formattedArtifacts);
                } else {
                    setArtifacts({});
                }

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
                            const retryData = await postRequest(getApiUrl('/games/storable-artifacts'), {
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


    const handleArtifactAdded = (event: CustomEvent) => {
        const newArtifact = event.detail.title;
        console.log(`Nouvel artefact reçu: ${newArtifact}`);

        // Ajouter ou incrémenter le compteur de l'artefact
        setArtifacts(prevArtifacts => ({
            ...prevArtifacts,
            [newArtifact]: (prevArtifacts[newArtifact] || 0) + 1
        }));
    };

    useEffect(() => {
        window.addEventListener("artifactAdded", handleArtifactAdded as EventListener);
        return () => {
            window.removeEventListener("artifactAdded", handleArtifactAdded as EventListener);
        };
    }, []);

    const handleArtifactUse = (artifact: string, callback: () => void) => {
        console.log(`Tentative d'utilisation de ${artifact}`);
        if (artifacts[artifact] > 0) {
            console.log(`${artifact} utilisé !`);
            callback();
            setArtifacts(prev => {
                const updated = { ...prev };
                updated[artifact]--;
                if (updated[artifact] === 0) delete updated[artifact];
                return updated;
            });
        } else {
            console.log(`Impossible d'utiliser ${artifact}, quantité insuffisante.`);
        }
    };

    useEffect(() => {
        fetchArtifacts();
    }, []);

    return (
        <div className="actions-container fade-in">
            {Object.entries(artifacts).map(([artifact, count]) => {
                console.log("Artifact in list:", artifact, "Count:", count);
                return (
                    <button
                        key={artifact}
                        className="action-button"
                        id={artifact}
                        onClick={() => handleArtifactUse(artifact, {
                            "Teleporter": onTeleport,
                            "Backtrack": onBack,
                            "Eraser": onEraser,
                            "Mine": onMine,
                            "Disorienter": onDisorienter,
                            "Snail": onSnail
                        }[artifact] || (() => {}))}
                    >
                        {artifact} ({count})
                    </button>
                );
            })}
        </div>
    );
};

export default Actions;
