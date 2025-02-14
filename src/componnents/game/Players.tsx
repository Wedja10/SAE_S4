import React from "react";
import '../../style/game/Players.css';

const Players: React.FC = () => {
    const players = [
        { name: "Joueur 1", score: 25, pp: '/assets/playerPicture.png' },
        { name: "Joueur 2", score: 18, pp: '/assets/playerPicture.png' },
        { name: "Joueur 3", score: 12, pp: '/assets/playerPicture.png' },
        { name: "Joueur 4", score: 8, pp: '/assets/playerPicture.png' },
    ];

    return (
        <div className="players-container fade-in">
            <h2 className="players-title">Joueurs</h2>
            <ul className="players-list">
                {players.map((player, index) => (
                    <div key={index}>
                        <li className="player-item">
                            <img src={player.pp} alt="" className="ppGame"/> - {player.name} - {player.score} pts
                        </li>
                        <hr />
                    </div>
                ))}
            </ul>
        </div>
    );
};

export default Players;
