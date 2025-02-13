import Footer from "../componnents/Footer.tsx";
import Navbar from "../componnents/Navbar.tsx";
import "../componnents/LobbyComponents.tsx";
import '../style/Lobby.css';
import {PlayerList} from "../componnents/LobbyComponents.tsx";

const Lobby: React.FC = () => {

  const players: string[] = ["VOUS", "LE BON", "LA BRUTE", "LE TRUAND", "TEST", "TEST", "TEST", "TEST", "TEST"]; // Joueurs à récupérer du back

  return (
    <>
      <header>
          <Navbar />
      </header>
      <div className="lobbyContent">
        <PlayerList players={players} />
      </div>
      <Footer />
    </>
  );
};

export default Lobby;
