import "../../style/leaderboard/leaderboard.css";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { useEffect, useState } from "react";
import { Storage } from "../../utils/storage.ts";

const FirstPlace = ({ player, score, pp }: { player: string; score: string; pp: string }) => (
    <div className="firstPlaceContainer">
        <img src="/public/assets/leaderboard/firstPlace.png" className="firstPlaceDecor" alt="First Place Crown" />
        <div className="firstPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
            <div className="textContainer">
                <div className="playerName">{player}</div>
                <div className="playerScore">{score}</div>
            </div>
        </div>
    </div>
);

const SecondPlace = ({ player, score, pp }: { player: string; score: string; pp: string }) => (
    <div className="secondPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
        <img src="/public/assets/leaderboard/secondPlace.png" className="placementBadge" alt="Third Place Badge" />
        <div className="textContainer2">
            <div className="playerName2">{player}</div>
            <div className="playerScore">{score}</div>
        </div>
    </div>
);

const ThirdPlace = ({ player, score, pp }: { player: string; score: string; pp: string }) => (
    <div className="thirdPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
        <img src="/public/assets/leaderboard/thirdPlace.png" className="placementBadge" alt="Third Place Badge" />
        <div className="textContainer3">
            <div className="playerName3">{player}</div>
            <div className="playerScore">{score}</div>
        </div>
    </div>
);

interface PlayerScore {
    pseudo: string;
    score: string;
    pp: string;
}

export const Podium = () => {
    const [players, setPlayers] = useState<PlayerScore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const gameId = Storage.getGameId();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const response = await postRequest(getApiUrl("/games/leaderBoard"), {
                    id_game: gameId, // utilise l'ID du jeu ou l'ID par défaut
                });

                if (response && response.players) {
                    setPlayers(response.players);
                    setError(null);
                } else {
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                setError("Failed to load leaderboard");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId]);

    // Définit des placeholders pour les positions manquantes
    const first = players[0] || { pseudo: "---", score: "0", pp: "" };
    const second = players[1] || { pseudo: "---", score: "0", pp: "" };
    const third = players[2] || { pseudo: "---", score: "0", pp: "" };

    if (isLoading) {
        return <div className="podium loading">Loading leaderboard...</div>;
    }

    if (error) {
        return <div className="podium error">Error: {error}</div>;
    }

    return (
        <div className="podium">
            <SecondPlace player={second.pseudo} score={second.score} pp={second.pp} />
            <FirstPlace player={first.pseudo} score={first.score} pp={first.pp} />
            <ThirdPlace player={third.pseudo} score={third.score} pp={third.pp} />
        </div>
    );
};

export const LeaderboardList = () => {
    const [players, setPlayers] = useState<PlayerScore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const gameId = Storage.getGameId();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const response = await postRequest(getApiUrl("/games/leaderBoard"), {
                    id_game: gameId, // utilise l'ID du jeu ou l'ID par défaut
                });

                if (response && response.players) {
                    setPlayers(response.players);
                    setError(null);
                } else {
                    setError("Invalid response format");
                }
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                setError("Failed to load leaderboard");
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [gameId]);

    if (isLoading) {
        return <div className="leaderboardList loading">Loading leaderboard data...</div>;
    }

    if (error) {
        return <div className="leaderboardList error">Error: {error}</div>;
    }

    if (players.length <= 3) {
        return <div className="leaderboardList empty">No additional players found.</div>;
    }

    const remainingPlayers = players.slice(3);
    const half = Math.ceil(remainingPlayers.length / 2);
    const firstHalf = remainingPlayers.slice(0, half);
    const secondHalf = remainingPlayers.slice(half);

    return (
        <div className="leaderboardList">
            <div className="leaderboardColumn">
                {firstHalf.map((player, index) => (
                    <div key={index} className="leaderboardRow">
                        <div className="rowClassment">{index + 4}{getOrdinalSuffix(index + 4)}</div>
                        <div className="rowPlayer">{player.pseudo}</div>
                        <div className="rowScore">{player.score}</div>
                    </div>
                ))}
            </div>
            <div className="leaderboardColumn">
                {secondHalf.map((player, index) => (
                    <div key={index + half} className="leaderboardRow">
                        <div className="rowClassment">{index + 4 + half}{getOrdinalSuffix(index + 4 + half)}</div>
                        <div className="rowPlayer">{player.pseudo}</div>
                        <div className="rowScore">{player.score}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Fonction utilitaire pour ajouter le suffixe ordinal correct (st, nd, rd, th)
const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;

    if (j === 1 && k !== 11) {
        return "st";
    }
    if (j === 2 && k !== 12) {
        return "nd";
    }
    if (j === 3 && k !== 13) {
        return "rd";
    }
    return "th";
};