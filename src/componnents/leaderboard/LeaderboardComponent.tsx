import "../../style/leaderboard/leaderboard.css";
import { postRequest } from "../../backend/services/apiService.js";
import { getApiUrl } from "../../utils/config";
import { useEffect, useState } from "react";
import { Storage } from "../../utils/storage.ts";
import { useNavigate } from "react-router-dom";

const FirstPlace = ({ player, score, pp, onViewArticles }: { player: string; score: string; pp: string; onViewArticles: () => void }) => (
    <div className="firstPlaceContainer">
        <img src="/public/assets/leaderboard/firstPlace.png" className="firstPlaceDecor" alt="First Place Crown" />
        <div className="firstPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
            <div className="textContainer">
                <div className="playerName">{player}</div>
                <div className="playerScore">{score}</div>
                <button className="viewArticlesBtn" onClick={onViewArticles}>View Articles</button>
            </div>
        </div>
    </div>
);

const SecondPlace = ({ player, score, pp, onViewArticles }: { player: string; score: string; pp: string; onViewArticles: () => void }) => (
    <div className="secondPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
        <img src="/public/assets/leaderboard/secondPlace.png" className="placementBadge" alt="Second Place Badge" />
        <div className="textContainer2">
            <div className="playerName2">{player}</div>
            <div className="playerScore">{score}</div>
            <button className="viewArticlesBtn" onClick={onViewArticles}>View Articles</button>
        </div>
    </div>
);

const ThirdPlace = ({ player, score, pp, onViewArticles }: { player: string; score: string; pp: string; onViewArticles: () => void }) => (
    <div className="thirdPlace" style={{ backgroundImage: pp ? `url(${pp})` : 'url("/public/assets/default-avatar.png")' }}>
        <img src="/public/assets/leaderboard/thirdPlace.png" className="placementBadge" alt="Third Place Badge" />
        <div className="textContainer3">
            <div className="playerName3">{player}</div>
            <div className="playerScore">{score}</div>
            <button className="viewArticlesBtn" onClick={onViewArticles}>View Articles</button>
        </div>
    </div>
);

interface PlayerScore {
    pseudo: string;
    score: string;
    pp: string;
    visitedArticles?: string[]; // Nouvelle propriété pour les articles visités
}

// Modal amélioré pour afficher les articles visités avec pagination et design responsive
const ArticlesModal = ({ player, articles, onClose }: { player: string; articles: string[]; onClose: () => void }) => {
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [articlesPerPage, setArticlesPerPage] = useState<number>(10);

    // Ajuster le nombre d'articles par page en fonction de la taille de l'écran
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 480) {
                setArticlesPerPage(5);
            } else if (window.innerWidth <= 768) {
                setArticlesPerPage(8);
            } else {
                setArticlesPerPage(10);
            }
        };

        handleResize(); // Appliquer immédiatement
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // Filtrer les articles en fonction du terme de recherche
    const filteredArticles = articles.filter(article =>
        article.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

    // Obtenir les articles pour la page actuelle
    const currentArticles = filteredArticles.slice(
        (currentPage - 1) * articlesPerPage,
        currentPage * articlesPerPage
    );

    // S'assurer que la page actuelle est valide après filtrage
    useEffect(() => {
        if (currentPage > totalPages && totalPages > 0) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Navigation entre les pages
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="articlesModalOverlay" onClick={(e) => {
            // Fermer le modal si on clique en dehors de celui-ci
            if ((e.target as HTMLElement).className === 'articlesModalOverlay') {
                onClose();
            }
        }}>
            <div className="articlesModal">
                <div className="modalHeader">
                    <h2>{player}'s Visited Articles</h2>
                    <button className="closeModalBtn" onClick={onClose} aria-label="Close">×</button>
                </div>

                {articles && articles.length > 0 ? (
                    <>
                        <div className="modalSearchContainer">
                            <input
                                type="text"
                                placeholder="Search articles..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page when searching
                                }}
                                className="modalSearchInput"
                                aria-label="Search articles"
                            />
                            <div className="articlesCount">
                                {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {filteredArticles.length > 0 ? (
                            <>
                                <ul className="articlesList">
                                    {currentArticles.map((article, index) => (
                                        <li key={index} className="articleItem">
                                            {article}
                                        </li>
                                    ))}
                                </ul>

                                {totalPages > 1 && (
                                    <div className="paginationContainer">
                                        <button
                                            className="paginationButton"
                                            disabled={currentPage === 1}
                                            onClick={() => goToPage(currentPage - 1)}
                                            aria-label="Previous page"
                                        >
                                            &laquo;
                                        </button>

                                        <div className="paginationInfo">
                                            {currentPage} / {totalPages}
                                        </div>

                                        <button
                                            className="paginationButton"
                                            disabled={currentPage === totalPages}
                                            onClick={() => goToPage(currentPage + 1)}
                                            aria-label="Next page"
                                        >
                                            &raquo;
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p className="noArticles">No articles match your search</p>
                        )}
                    </>
                ) : (
                    <p className="noArticles">No articles visited</p>
                )}
            </div>
        </div>
    );
};

export const Podium = () => {
    const [players, setPlayers] = useState<PlayerScore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);

    const gameId = Storage.getGameId();

    useEffect(() => {
        const checkActiveChallenge = async () => {
            const activeChallengeData = localStorage.getItem('dailyChallenge');

            if (activeChallengeData) {
                try {
                    await postRequest(getApiUrl("/games/update-challenge"), {
                        id_game: gameId
                    });
                } catch (error) {
                    console.error('Error parsing active challenge data:', error);
                }
            }
        };

        checkActiveChallenge();
    }, []);


    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const response = await postRequest(getApiUrl("/games/leaderBoard"), {
                    id_game: gameId,
                });

                if (response && response.players) {
                    // Ajoutez des données fictives d'articles visités pour tester
                    const playersWithArticles = response.players.map((player: any) => ({
                        pseudo: player.pseudo,
                        score: player.score,
                        pp: player.pp,
                        visitedArticles: player.visited || []
                    }));

                    setPlayers(playersWithArticles);
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

    const handleViewArticles = (player: PlayerScore) => {
        setSelectedPlayer(player);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPlayer(null);
    };

    // Définit des placeholders pour les positions manquantes
    const first = players[0] || { pseudo: "---", score: "0", pp: "", visitedArticles: [] };
    const second = players[1] || { pseudo: "---", score: "0", pp: "", visitedArticles: [] };
    const third = players[2] || { pseudo: "---", score: "0", pp: "", visitedArticles: [] };

    if (isLoading) {
        return <div className="podium loading">Loading leaderboard...</div>;
    }

    if (error) {
        return <div className="podium error">Error: {error}</div>;
    }

    return (
        <div className="podium">
            <SecondPlace
                player={second.pseudo}
                score={second.score}
                pp={second.pp}
                onViewArticles={() => handleViewArticles(second)}
            />
            <FirstPlace
                player={first.pseudo}
                score={first.score}
                pp={first.pp}
                onViewArticles={() => handleViewArticles(first)}
            />
            <ThirdPlace
                player={third.pseudo}
                score={third.score}
                pp={third.pp}
                onViewArticles={() => handleViewArticles(third)}
            />

            {showModal && selectedPlayer && (
                <ArticlesModal
                    player={selectedPlayer.pseudo}
                    articles={selectedPlayer.visitedArticles || []}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export const LeaderboardList = () => {
    const [players, setPlayers] = useState<PlayerScore[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<PlayerScore | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);

    const gameId = Storage.getGameId();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                const response = await postRequest(getApiUrl("/games/leaderBoard"), {
                    id_game: gameId,
                });

                if (response && response.players) {
                    // Ajoutez des données fictives d'articles visités pour tester
                    const playersWithArticles = response.players.map((player: PlayerScore, index: number) => ({
                        ...player,
                        visitedArticles: [
                            `Wikipedia: ${player.pseudo}'s Journey`,
                            `Science Article ${index + 1}`,
                            `History of ${player.pseudo}`
                        ]
                    }));
                    setPlayers(playersWithArticles);
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

    const handleViewArticles = (player: PlayerScore) => {
        setSelectedPlayer(player);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedPlayer(null);
    };

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
                        <button className="viewArticlesBtn small" onClick={() => handleViewArticles(player)}>Articles</button>
                    </div>
                ))}
            </div>
            <div className="leaderboardColumn">
                {secondHalf.map((player, index) => (
                    <div key={index + half} className="leaderboardRow">
                        <div className="rowClassment">{index + 4 + half}{getOrdinalSuffix(index + 4 + half)}</div>
                        <div className="rowPlayer">{player.pseudo}</div>
                        <div className="rowScore">{player.score}</div>
                        <button className="viewArticlesBtn small" onClick={() => handleViewArticles(player)}>Articles</button>
                    </div>
                ))}
            </div>

            {showModal && selectedPlayer && (
                <ArticlesModal
                    player={selectedPlayer.pseudo}
                    articles={selectedPlayer.visitedArticles || []}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

// Bouton pour revenir à l'accueil
export const HomeButton = () => {
    const navigate = useNavigate();

    const goToHome = () => {
        navigate('/');
    };

    return (
        <button className="homeButton" onClick={goToHome}>
            Return to Home
        </button>
    );
};

// Composant principal qui combine tous les éléments
export const LeaderboardComponent = () => {
    return (
        <div className="leaderboardBg">
            <HomeButton />
            <Podium />
            <LeaderboardList />
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