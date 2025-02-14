import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import { PlayerList } from "../componnents/lobby/LobbyComponents.tsx";
import { ArtefactsList } from "../componnents/lobby/Artefacts.tsx";

const Lobby: React.FC = () => {

  const players: string[] = ["VOUS", "LE BON", "LA BRUTE", "LE TRUAND", "TEST", "TEST", "TEST", "TEST", "TEST", "TEST", "TEST", "TEST", "TEST", "TEST"]; // Joueurs à récupérer du back

  const artefacts: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"]; // Artefacts utilisés

  return (
    <>
      <div className="headerLobby">
        <Navbar />
      </div>
      <div className="lobbyContent">
        <PlayerList players={players} />
        <ArtefactsList artefacts={artefacts} />
      </div>
    </>
  );
};

export default Lobby;