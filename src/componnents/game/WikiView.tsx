import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../style/game/WikiView.css";

const WikiView: React.FC = () => {
  const { title } = useParams<{ title: string }>();
  const [currentTitle, setCurrentTitle] = useState<string | null>(title || null);
  const [wikiContent, setWikiContent] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]); // Stocke les titres visités

  // Fonction pour récupérer un titre aléatoire
  async function getRandomWikipediaTitle(): Promise<string> {
    const url = "https://fr.wikipedia.org/api/rest_v1/page/random/title";
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const data = await response.json();
      return data.items[0].title;
    } catch (error) {
      console.error("Erreur lors de la récupération du titre aléatoire:", error);
      throw error;
    }
  }

  // Fonction pour récupérer le contenu HTML de l'article
  async function fetchWikiContent(pageTitle: string) {
    const url = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const html = await response.text();
      setWikiContent(html);

      // Ajouter l'article visité à l'historique (éviter doublons)
      setHistory((prevHistory) =>
          prevHistory.includes(pageTitle) ? prevHistory : [...prevHistory, pageTitle]
      );

      // Log dans la console (peut être remplacé par un appel API)
      console.log("Article visité :", pageTitle);
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu Wikipedia:", error);
    }
  }

  useEffect(() => {
    const loadPage = async () => {
      try {
        const pageTitle = currentTitle || (await getRandomWikipediaTitle());
        setCurrentTitle(pageTitle);
        fetchWikiContent(pageTitle);
      } catch (error) {
        console.error("Impossible de charger l'article.");
      }
    };
    loadPage();
  }, [currentTitle]);

  // Intercepter les clics sur les liens
  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const link = (event.target as HTMLElement).closest("a");
    if (link && link.href.includes("/wiki/")) {
      event.preventDefault();
      const newTitle = link.href.split("/wiki/")[1];
      if (newTitle) {
        setCurrentTitle(decodeURIComponent(newTitle));
        fetchWikiContent(newTitle);
      }
    }
  };

  return (
      <div className="wiki-container fade-in">
        <h2 className="wiki-title">{currentTitle}</h2>
        <div className="wiki-content" onClick={handleLinkClick} dangerouslySetInnerHTML={{ __html: wikiContent }} />

        {/* Affichage de l'historique */}
        <div className="wiki-history">
          <h3>Historique des articles visités :</h3>
          <ul>
            {history.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
  );
};

export default WikiView;
