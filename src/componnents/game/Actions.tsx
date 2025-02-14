import React from "react";
import '../../style/game/Actions.css';

const Actions: React.FC = () => {
    return (
        <div className="actions-container fade-in">
            <button className="action-button mine-button">Mine</button>
            <button className="action-button teleport-button">Teleport</button>
            <button className="action-button"></button>
            <button className="action-button"></button>
        </div>
    );
};

export default Actions;
