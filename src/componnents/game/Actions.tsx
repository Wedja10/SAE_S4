import React, {useEffect, useState} from "react";
import '../../style/game/Actions.css';
import { postRequest } from "C:/Users/jawes/WebstormProjects/SAE_S4/src/backend/services/apiService.js";

const Actions: React.FC = () => {
    const [artifacts, setArtifacts] = useState<string[]>([]);

    const fetchArtifacts = async () => {
        const data = await postRequest('http://localhost:3000/games/artifacts', {
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
                    <button className="action-button mine-button">{artifact}</button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Actions;
