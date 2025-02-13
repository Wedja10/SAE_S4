import Footer from "../componnents/Footer.tsx";
import Navbar from "../componnents/Navbar.tsx";
import "../componnents/lobby/LobbyComponents.tsx";
import '../style/Lobby.css';
import {PlayerList} from "../componnents/lobby/LobbyComponents.tsx";

const Lobby: React.FC = () => {

  const players: string[] = ["VOUS", "LE BON", "LA BRUTE", "LE TRUAND"]; 

  return (
    <>
      <header className="loby-header">
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
