import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style/game/Game.css';
import Articles from "../componnents/game/Articles";
import WikiView from "../componnents/game/WikiView";
import Actions from "../componnents/game/Actions";
import Players from "../componnents/game/Players";
import Chat from "../componnents/game/Chat";

const Game: React.FC = () => {
  // Récupérer l'ID de la page depuis l'URL
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Si aucun ID n'est fourni, rediriger vers la page d'accueil
    if (!pageId) {
      //navigate('/lobby'); Retour au lobby si pas d'id dans l'url (unsafe)
    }
  }, [pageId, navigate]);

  // Si aucun ID n'est fourni, ne rien afficher (la redirection est en cours)
  if (!pageId) {
    //return null;
  }

  return (
    <div className="game-container">
      {/* Sidebar gauche */}
      <aside className="sidebar-left">
        <Articles />
      </aside>

      {/* Contenu principal */}
      <main className="main-content">
        {/* <WikiView pageId={pageId} /> Id dans l'url (unsafe) */}
        <WikiView pageId="4534806" />
        <Actions />
      </main>

      {/* Sidebar droite */}
      <aside className="sidebar-right">
        <Players />
        <Chat />
      </aside>
    </div>
  );
};

export default Game;