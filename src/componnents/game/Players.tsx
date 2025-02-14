import React from "react";
import '../../style/game/Players.css';

const Players: React.FC = () => {
    const players = [
        { name: "Joueur 1", score: 25 },
        { name: "Joueur 2", score: 18 },
        { name: "Joueur 3", score: 12 },
        { name: "Joueur 4", score: 8 },
    ];

    return (
        <div className="players-container fade-in">
            <h2 className="players-title">Joueurs</h2>
            <ul className="players-list">
                {players.map((player, index) => (
                    <li key={index} className="player-item">
                        {player.name} - {player.score} pts
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Players;
