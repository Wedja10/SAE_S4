import { useNavigate } from "react-router-dom";
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';
import {useState} from "react";

export const StartButton = () => {
  const navigate = useNavigate();

  const handleStartGame = () => {
    navigate(`/game`);
  };

  return (
    <button onClick={handleStartGame} className="startButton fade-in">
      <img src={"public/assets/StartArrow.png"} alt={""}/> LAUCH
    </button>
  );
}

export const OptionsPanel = () => {
  const [unlimitedPlayers, setUnlimitedPlayers] = useState(true);
  const [unlimitedTime, setUnlimitedTime] = useState(true);

  const handleUnlimitedPlayers = () => {
    setUnlimitedPlayers(!unlimitedPlayers);
  };

  const handleUnlimitedTime = () => {
    setUnlimitedTime(!unlimitedTime);
  }

  const [allowToJoin, setAllowToJoin] = useState(false);

  const handleAllowToJoin = () => {
    setAllowToJoin(!allowToJoin);
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    handleAllowToJoin();

    if (allowToJoin) {
      return
    }

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    alert(JSON.stringify(data, null, 2)); // -------------- Ici pour le back à ajouter
  };

  return (
    <div className={"OptionsPanel"} >
      <form method={"put"} onSubmit={handleSubmit}>
        <div className={"OptionsList"}>

          <div className={"Option"}>
            <label htmlFor={"playerNumber"}>Number of players</label>

            {unlimitedPlayers ?
              <input type={"text"} name={"playersNumber"} id={"playerNumber"} value={"UNLIMITED"} readOnly disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}/> :
              <input type={"number"} name={"playersNumber"} id={"playerNumber"} min={1} required disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}/>}

            <img src={unlimitedPlayers ? "public/assets/UnlimitedButton.png" : "public/assets/LimitedButton.png"} onClick={allowToJoin ? undefined : handleUnlimitedPlayers} alt={"unlimited"}/>
          </div>

          <div className={"Option"}>
            <label htmlFor={"timeLimit"}>Time limit</label>

            {unlimitedTime ?
              <input type={"text"} name={"timeLimit"} id={"timeLimit"} value={"UNLIMITED"} readOnly disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}/> :
              <input type={"number"} name={"timeLimit"} id={"timeLimit"} min={1} required disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}/>}

            <img src={unlimitedTime ? "public/assets/UnlimitedButton.png" : "public/assets/LimitedButton.png"} onClick={allowToJoin ? undefined : handleUnlimitedTime} alt={"unlimited"}/>
          </div>

          <div className={"Option"}>
            <label htmlFor={"articlesNumber"}>Number of articles</label>
            <input type={"number"} name={"articlesNumber"} id={"articlesNumber"} defaultValue={5} min={2} max={16} required disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}/>
          </div>

          <div className={"Option"}>
            <label htmlFor={"visibility"}>Visibility</label>
            <select name={"visibility"} id={"visibility"} disabled={allowToJoin} className={allowToJoin ? "disabled-input" : ""}>
              <option value={"public"}>Public</option>
              <option value={"private"}>Private</option>
            </select>
          </div>

        </div>

        <input className={"SubmitOptions"} type={"submit"} value={allowToJoin ? "Close room" : "Allow to join"} style={{
          backgroundColor: allowToJoin ? "#ff3838" : "#2a830c"
        }}/>
      </form>

    </div>
  )
}

export const OptionsPanelSolo = () => {
  const navigate = useNavigate();

  const [unlimitedTime, setUnlimitedTime] = useState(true);

  const handleUnlimitedTime = () => {
    setUnlimitedTime(!unlimitedTime);
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    alert(JSON.stringify(data, null, 2)); // -------------- Ici pour le back à ajouter

    navigate(`/game`);
  };

  return (
    <div className={"OptionsPanel"} >
      <form method={"put"} onSubmit={handleSubmit}>
        <div className={"OptionsList"}>

          <div className={"Option"}>
            <label htmlFor={"timeLimit"}>Time limit</label>

            {unlimitedTime ?
              <input type={"text"} name={"timeLimit"} id={"timeLimit"} value={"UNLIMITED"} readOnly/> :
              <input type={"number"} name={"timeLimit"} id={"timeLimit"} min={1} required/>}

            <img src={unlimitedTime ? "public/assets/UnlimitedButton.png" : "public/assets/LimitedButton.png"} onClick={handleUnlimitedTime} alt={"unlimited"}/>
          </div>

          <div className={"Option"}>
            <label htmlFor={"articlesNumber"}>Number of articles</label>
            <input type={"number"} name={"articlesNumber"} id={"articlesNumber"} defaultValue={5} min={2} max={16} required />
          </div>

        </div>

        <input className={"SubmitOptions"} type={"submit"} value={"LAUCH"} style={{
          backgroundColor: "#17141d",
          borderColor: "#f1b24a"
        }}/>
      </form>

    </div>
  )
}

export const ArtefactsList = (props: { artefacts: string[] }) => {
  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {props.artefacts.map((artefact, index) => (
          <Artefact key={index} artefact={artefact}/>
        ))}
      </div>
    </div>
  );
};

export const Artefact = (props: { artefact: string }) => {
  return (
    <div className="Artefact fade-in">
      <img className="ArtefactInfo" src={ArtefactInfo} alt="Artefact Info"/>
      <img
        className="ArtefactImage"
        src={`/assets/Artefacts/${props.artefact}.png`}
        alt="Artefact"
        style={{ height: '100px' }}
      />
      <p>{props.artefact}</p>
    </div>
  );
};
