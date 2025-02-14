import React from "react";
import '../style/game/Game.css';
import Articles from "../componnents/game/Articles";
import WikiView from "../componnents/game/WikiView";
import Actions from "../componnents/game/Actions";
import Players from "../componnents/game/Players";
import Chat from "../componnents/game/Chat";

const Game: React.FC = () => {
  return (
    <div className="game-container">
      {/* Sidebar gauche */}
      <aside className="sidebar-left">
        <Articles />
      </aside>

      {/* Contenu principal */}
      <main className="main-content">
        <h1 className="game-title fade-in">ULRICH OBRECHT</h1>
        <WikiView />
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