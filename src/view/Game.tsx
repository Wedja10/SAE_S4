import '../style/game/Game.css';
import Articles from "../componnents/game/Articles";
import WikiView from "../componnents/game/WikiView";
import Actions from "../componnents/game/Actions";
import Players from "../componnents/game/Players";
import Chat from "../componnents/game/Chat";

const Game: React.FC = () => {

    // Prendre le titre depuis l'URL
    const url = window.location.href;
    const title = url.split("/").pop();

    return (
        <div className="game-container">
            {/* Sidebar gauche */}
            <aside className="sidebar-left">
                <Articles />
            </aside>

            {/* Contenu principal */}
            {title &&
                <main className="main-content">
                    <WikiView title={title.split("#")[0]} />
                    <Actions />
                </main>
            }

            {/* Sidebar droite */}
            <aside className="sidebar-right">
                <Players />
                <Chat />
            </aside>
        </div>
    );
};

export default Game;