import '../style/Lobby.css';
import '../style/choice/choice.css'
import Navbar from "../componnents/Navbar.tsx";
import {ChoicePanel} from "../componnents/choice/ChoiceComponents.tsx";

const Choice: React.FC = () => {
  return (
    <>
      <div className="headerLobby">
        <Navbar/>
      </div>
      <ChoicePanel/>
    </>
  );
};

export default Choice;
