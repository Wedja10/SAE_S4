import React from "react";
import '../../style/game/Actions.css';

const Actions: React.FC = () => {
    return (
        <div className="actions-container">
            <button className="action-button mine-button">Mine</button>
            <button className="action-button teleport-button">Teleport</button>
        </div>
    );
};

export default Actions;
