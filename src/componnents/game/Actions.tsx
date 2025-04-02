import React, { useEffect, useState, useRef } from "react";
import '../../style/game/Actions.css';
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { Storage } from "../../utils/storage";

interface ActionsProps {
    onTeleport: () => void;
    onBack: () => void;
    onEraser: () => void;
    onMine: () => void;
    onDisorienter: () => void;
    onSnail: () => void;
}

const Actions: React.FC<ActionsProps> = ({ onTeleport, onBack, onEraser, onMine, onDisorienter, onSnail }) => {
    const [artifacts, setArtifacts] = useState<{ [key: string]: number }>({});
    const isMounted = useRef(true);

    const fetchArtifactsFromDB = async () => {
        try {
            const gameId = Storage.getGameId();
            const playerId = Storage.getPlayerId();

            if (!gameId || !playerId) {
                console.error("Missing Game ID or Player ID");
                return;
            }

            console.log("Fetching artifacts from DB...");
            const data = await postRequest(getApiUrl('/games/storable-artifacts'), {
                id_game: gameId,
                id_player: playerId
            });

            if (Array.isArray(data)) {
                const formattedArtifacts = data.reduce((acc, artifact) => {
                    acc[artifact] = (acc[artifact] || 0) + 1;
                    return acc;
                }, {} as { [key: string]: number });

                if (isMounted.current) setArtifacts(formattedArtifacts);
            } else {
                if (isMounted.current) setArtifacts({});
            }
        } catch (error) {
            console.error("Error fetching artifacts:", error);
            if (isMounted.current) setArtifacts({});
        }
    };

    const handleArtifactUse = (artifact: string, callback: () => void) => {
        if (artifacts[artifact] > 0) {
            callback();
            setArtifacts(prev => {
                const updated = { ...prev };
                updated[artifact]--;
                if (updated[artifact] === 0) delete updated[artifact];
                return updated;
            });
        } else {
            console.log(`Not enough ${artifact} to use.`);
        }
    };

    useEffect(() => {
        isMounted.current = true;
        fetchArtifactsFromDB();

        // Rafraîchit les données toutes les 3 secondes
        const interval = setInterval(fetchArtifactsFromDB, 3000);

        return () => {
            isMounted.current = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="actions-container fade-in">
            {Object.entries(artifacts).map(([artifact, count]) => (
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
            ))}
        </div>
    );
};

export default Actions;
