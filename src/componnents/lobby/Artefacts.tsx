import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ArtefactInfo from '/assets/Artefacts/ArtefactInfo.svg';

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
  const navigate = useNavigate();

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

  const handleStartGame = () => {
    if (randomTitle) {
      // Redirige vers /game/:title
      navigate(`/game`);
    }
  };

  return (
    <div className='ArtefactsListContainer'>
      <div className="ArtefactsList">
        {props.artefacts.map((artefact, index) => (
          <Artefact key={index} artefact={artefact} />
        ))}
      </div>
      {randomTitle && (
        <button onClick={handleStartGame} className="startButton fade-in">
          START GAME
        </button>
      )}
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
