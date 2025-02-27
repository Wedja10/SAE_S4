import React, { useEffect, useState } from "react";
import "../../style/game/WikiView.css";

const WikiView: React.FC = () => {
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [wikiContent, setWikiContent] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const blockBackNavigation = () => {
      window.history.pushState(null, "", window.location.href);
    };

    // Empêche la navigation arrière dès le montage
    blockBackNavigation();
    window.addEventListener("popstate", blockBackNavigation);

    if (!currentTitle) {
      getRandomWikipediaTitle().then(setCurrentTitle).catch(console.error);
    } else {
      fetchWikiContent(currentTitle);
    }

    return () => {
      window.removeEventListener("popstate", blockBackNavigation);
    };
  }, [currentTitle]);

  async function getRandomWikipediaTitle(): Promise<string> {
    const url = "https://fr.wikipedia.org/api/rest_v1/page/random/title";
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
    const data = await response.json();
    return data.items[0].title;
  }

  async function fetchWikiContent(pageTitle: string) {
    setIsLoading(true);

    const url = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(pageTitle)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      const html = await response.text();

      setWikiContent(html);

      setHistory((prevHistory) => {
        if (prevHistory[prevHistory.length - 1] !== pageTitle) {
          return [...prevHistory, pageTitle];
        }
        return prevHistory;
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du contenu Wikipedia:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLinkClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const link = (event.target as HTMLElement).closest("a");
    if (link && link.href.includes("/wiki/")) {
      event.preventDefault();
      const newTitle = decodeURIComponent(link.href.split("/wiki/")[1]);
      setCurrentTitle(newTitle);
    }
  };

  const handleGoBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop(); // Retire le dernier (article actuel)
      const previousTitle = newHistory[newHistory.length - 1]; // Récupère l'article précédent
      setHistory(newHistory); // Met à jour l'historique
      setCurrentTitle(previousTitle); // Charge l'article précédent
    }
  };

  return (
      <div className="wiki-container">
        <h2 className="wiki-title">{currentTitle}</h2>

        <div
            className={`wiki-content ${isLoading ? "loading" : "fade-in"}`}
            onClick={handleLinkClick}
        >
          {isLoading ? (
              <div className="loading-spinner">Chargement...</div>
          ) : (
              <div dangerouslySetInnerHTML={{ __html: wikiContent }} />
          )}
        </div>

        <div className="wiki-history">
          <button
              onClick={handleGoBack}
              disabled={history.length <= 1}
              className="back-button"
          >
            ◀️ Article précédent
          </button>

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
