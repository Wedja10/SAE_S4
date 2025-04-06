import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../componnents/Navbar';
import '../style/DailyChallenge.css';
import { Storage } from '../utils/storage';

const DailyChallenge: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dailyChallenge, setDailyChallenge] = useState<any>(null);
    const navigate = useNavigate();

    // Vérifier si l'appareil est un mobile
    useEffect(() => {
        const checkIfMobile = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
            setIsMobile(isMobileDevice);
            setIsLoading(false);
        };

        checkIfMobile();
    }, []);

    // Simuler le chargement d'un daily challenge
    useEffect(() => {
        if (isMobile) {
            // Simulation de l'API qui renvoie le daily challenge
            setTimeout(() => {
                const mockChallenge = {
                    id: 'dc-' + new Date().toISOString().split('T')[0],
                    title: 'Challenge du jour',
                    description: 'Trouvez l\'article sur "Intelligence Artificielle" en moins de 3 minutes',
                    target: 'Intelligence_artificielle',
                    reward: 100,
                    difficulty: 'Moyen'
                };
                setDailyChallenge(mockChallenge);
            }, 1500);
        }
    }, [isMobile]);

    const handleStartChallenge = () => {
        if (dailyChallenge) {
            // Stockage des informations du challenge dans localStorage au lieu de Storage
            localStorage.setItem('dailyChallenge', JSON.stringify(dailyChallenge));
            
            // Créer une partie solo avec l'article cible
            navigate('/gameSolo', { state: { targetArticle: dailyChallenge.target } });
        }
    };

    if (isLoading) {
        return (
            <div className="daily-container">
                <Navbar />
                <div className="daily-loading">
                    <div className="loading-spinner"></div>
                    <p>Chargement...</p>
                </div>
            </div>
        );
    }

    if (!isMobile) {
        return (
            <div className="daily-container desktop-message">
                <Navbar />
                <div className="not-mobile-message">
                    <h2>Daily Challenge uniquement sur mobile</h2>
                    <p>Les daily challenges sont disponibles uniquement sur les appareils mobiles.</p>
                    <p>Veuillez vous connecter depuis votre smartphone ou tablette pour y accéder.</p>
                    <div className="phone-icon">
                        <i className="fas fa-mobile-alt"></i>
                    </div>
                    <button onClick={() => navigate('/')} className="back-button">
                        Retour à l'accueil
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="daily-container">
            <Navbar />
            <div className="daily-content">
                <h1>DAILY CHALLENGE</h1>
                
                {dailyChallenge ? (
                    <div className="challenge-card">
                        <div className="challenge-header">
                            <h2>{dailyChallenge.title}</h2>
                            <span className="difficulty">{dailyChallenge.difficulty}</span>
                        </div>
                        <p className="challenge-description">{dailyChallenge.description}</p>
                        <button onClick={handleStartChallenge} className="start-challenge-btn">
                            RELEVER LE DÉFI
                        </button>
                    </div>
                ) : (
                    <div className="daily-loading">
                        <div className="loading-spinner"></div>
                        <p>Chargement du défi du jour...</p>
                    </div>
                )}
                
                <div className="daily-info">
                    <h3>Comment ça fonctionne</h3>
                    <p>Un nouveau défi tous les jours. Relevez-le pour gagner des points et débloquer des récompenses exclusives!</p>
                </div>
            </div>
        </div>
    );
};

export default DailyChallenge; 