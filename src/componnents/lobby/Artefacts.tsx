import { useNavigate } from "react-router-dom";
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';

export const ArtefactsList = (props: { artefacts: string[] }) => {
  const navigate = useNavigate();

  const handleStartGame = () => {
      navigate(`/game`);
  };

  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {props.artefacts.map((artefact, index) => (
          <Artefact key={index} artefact={artefact} />
        ))}
      </div>
        <button onClick={handleStartGame} className="startButton fade-in">
          START GAME
        </button>
    </div>
  );
};

export const Artefact = (props: { artefact: string }) => {
  return (
    <div className="Artefact fade-in">
      <img className="ArtefactInfo" src={ArtefactInfo} alt="Artefact Info" />
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
