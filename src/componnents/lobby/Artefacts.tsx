export const ArtefactsList = (props: {artefacts: string[]}) => {
  return (
    <div className="ArtefactsList">
      {props.artefacts.map((artefact) => (
        <Artefact artefact={artefact} />
      ))}
    </div>
  )
}

export const Artefact = (props: {artefact: string}) => {
  return (
    <div className="Artefact">
      <img className="ArtefactInfo" src="/src/assets/Artefacts/ArtefactInfo.svg" />
      <img className="ArtefactImage" src={`/src/assets/Artefacts/${props.artefact}.png`} alt="X" style={{
        height: '100px',
      }} />
      <p>{props.artefact}</p>
    </div>
  )
}