import React from "react";
import '../../style/game/WikiView.css';

const WikiView: React.FC = () => {
    return (
        <div className="wiki-container">
            <h2 className="wiki-title">Ulrich Obrecht</h2>
            <p className="wiki-content">
                Ulrich Obrecht est un jurisconsulte et philologue français, né à Strasbourg le 23 juillet 1646...
            </p>
        </div>
    );
};

export default WikiView;
