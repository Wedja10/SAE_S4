import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import {ArtefactsList, OptionsPanelSolo} from "../componnents/lobby/Artefacts.tsx";

const Lobby: React.FC = () => {

  const artefacts: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"]; // Artefacts utilisés

  return (
    <>
      <div className="headerLobby">
        <Navbar />
      </div>
      <div className="lobbyContent">
        <div className={"GameInfo"}>
          <ArtefactsList artefacts={artefacts} />
          <OptionsPanelSolo/>
        </div>
      </div>
    </>
  );
};

export default Lobby;