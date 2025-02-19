import { NavLink } from 'react-router-dom';
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';
import {useEffect, useState} from "react";

async function getRandomWikipediaTitle(): Promise<string> {
  const url = "https://fr.wikipedia.org/api/rest_v1/page/random/title";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.items[0].title;
  } catch (error) {
    console.error("Erreur lors de la récupération du titre aléatoire:", error);
    throw error;
  }
}

export const ArtefactsList = (props: { artefacts: string[] }) => {
  const [randomTitle, setRandomTitle] = useState<string | null>(null);

  // Fonction pour récupérer un titre aléatoire
  useEffect(() => {
    const fetchRandomTitle = async () => {
      try {
        const title = await getRandomWikipediaTitle();
        setRandomTitle(title);
      } catch (error) {
        console.error("Erreur lors de la récupération du titre aléatoire:", error);
      }
    };

    fetchRandomTitle();
  }, []);

  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {props.artefacts.map((artefact, index) => (
          <Artefact key={index} artefact={artefact} />
        ))}
      </div>
      {/* Lien dynamique vers la page Wikipédia aléatoire */}
      {randomTitle && (
        <NavLink to={`/game/${encodeURIComponent(randomTitle)}`} className="startButton fade-in">
          START GAME
        </NavLink>
      )}
    </div>
  );
};

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