import Navbar from "../componnents/Navbar.tsx";
import '../style/Lobby.css';
import {ArtefactsList, OptionsPanelSolo} from "../componnents/lobby/Artefacts.tsx";
import { useState } from "react";

const Lobby: React.FC = () => {
  const artefacts: string[] = ["GPS", "Backtrack", "Teleporter", "Mine", "Snail",
    "Eraser", "Disorienter", "Dictator"]; // Artefacts utilisés
  const [enabledArtifacts, setEnabledArtifacts] = useState<Record<string, boolean>>({
    "GPS": true,
    "Backtrack": true,
    "Teleporter": true,
    "Mine": true,
    "Snail": true,
    "Eraser": true,
    "Disorienter": true,
    "Dictator": true
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