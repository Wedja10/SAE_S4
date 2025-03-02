import React, {useEffect, useState} from "react";
import '../../style/game/Actions.css';
import {postRequest} from "../../backend/services/apiService.js";
import {getApiUrl} from "../../utils/config";

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

    const fetchArtifacts = async () => {
        const data = await postRequest(getApiUrl('/games/artifacts'), {
            id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"
        });
        setArtifacts(data);
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
