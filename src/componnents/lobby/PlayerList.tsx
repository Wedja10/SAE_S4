import React from 'react';
import './PlayerList.css';

interface Player {
    id: string;
    pseudo: string;
    profilePicture?: string;
    is_host: boolean;
}

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string;
    children: (props: { player: Player; isCurrentPlayer: boolean }) => React.ReactElement;
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId, children }) => {
    return (
        <div className="player-list">
            {players.map((player) => (
                <div key={player.id} className="player-item">
                    {children({
                        player,
                        isCurrentPlayer: player.id === currentPlayerId
                    })}
                </div>
            ))}
        </div>
    );
}; 