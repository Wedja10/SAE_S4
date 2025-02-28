import React, {useEffect, useState} from "react";
import '../../style/game/Actions.css';
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";

const Actions: React.FC = () => {
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
                    <button className="action-button mine-button">{artifact}</button>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Actions;
