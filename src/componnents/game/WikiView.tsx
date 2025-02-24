import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../style/game/WikiView.css";

const WikiView: React.FC = () => {
  // Récupération du paramètre "title" depuis l'URL
  const { title } = useParams<{ title: string }>();
  // État pour stocker un titre aléatoire si aucun titre n'est fourni dans l'URL
  const [randomTitle, setRandomTitle] = useState<string | null>(null);

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

  useEffect(() => {
    // Si aucun titre n'est fourni dans l'URL, on récupère un titre aléatoire
    if (!title) {
      const fetchRandomTitle = async () => {
        try {
          const random = await getRandomWikipediaTitle();
          setRandomTitle(random);
        } catch (error) {
          console.error("Erreur lors de la récupération du titre aléatoire:", error);
        }
      };
      fetchRandomTitle();
    }
  }, [title]);

  // On utilise le titre passé en URL ou le titre aléatoire s'il n'y a pas de paramètre
  const articleTitle = title || randomTitle || "";
  const wikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(articleTitle)}`;

  return (
    <div className="wiki-container fade-in">
      <h1 className="wiki-title">{articleTitle.replace(/_/g, " ")}</h1>
      <iframe
        src={wikiUrl}
        title={articleTitle || "Wiki Page"}
        className="wiki-iframe"
      ></iframe>
    </div>
  );
};

export default WikiView;
