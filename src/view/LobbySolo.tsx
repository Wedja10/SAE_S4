import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import {ArtefactsList, OptionsPanelSolo} from "../componnents/lobby/Artefacts.tsx";
import { useState } from "react";

const Lobby: React.FC = () => {
  const artefacts: string[] = ["GPS", "BACK", "TELEPORT", "MINE", "SNAIL", "ERASER", "DISORIENTATOR", "DICTATOR"]; // Artefacts utilisés
  const [enabledArtifacts, setEnabledArtifacts] = useState<Record<string, boolean>>({
    "GPS": true,
    "BACK": true,
    "TELEPORT": true,
    "MINE": true,
    "SNAIL": true,
    "ERASER": true,
    "DISORIENTATOR": true,
    "DICTATOR": true
  });

  const handleArtifactToggle = (artifact: string, enabled: boolean) => {
    setEnabledArtifacts(prev => ({
      ...prev,
      [artifact]: enabled
    }));
  };

  return (
    <>
      <div className="headerLobby">
        <Navbar />
      </div>
      <div className="lobbyContent">
        <div className={"GameInfo"}>
          <ArtefactsList 
            artefacts={artefacts} 
            enabledArtifacts={enabledArtifacts}
            onToggleArtifact={handleArtifactToggle}
            isHost={true}
          />
          <OptionsPanelSolo />
        </div>
      </div>
    </>
  );
};

export default Lobby;