export const ArtefactsList = (props: { artefacts: string[] }) => {
  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {props.artefacts.map((artefact) => (
          <Artefact artefact={artefact} />
        ))}
      </div>
      <NavLink to="/game" className="startButton fade-in">START GAME</NavLink>
    </div>
  )
}

import { NavLink } from 'react-router-dom';
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';

export const Artefact = (props: { artefact: string }) => {
  return (
    <div className="Artefact fade-in">
      <img className="ArtefactInfo" src={ArtefactInfo} />
      <img className="ArtefactImage" src={`/assets/Artefacts/${props.artefact}.png`} alt="X" style={{
        height: '100px',
      }} />
      <p>{props.artefact}</p>
    </div>
  )
}