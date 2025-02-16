import React from "react";
import '../../style/game/WikiView.css';
import { useEffect, useState } from 'react';

async function getIdFromTitle(title: string): Promise<string> {
    const url = `https://fr.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(title)}&origin=*`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.info);
    }

    const page = data.query.search[0];
    if (!page) {
        throw new Error('Page non trouvée.');
    }

    return page.pageid;
}

const WikiView: React.FC<{ pageId: string }> = ({ pageId }) => {
    const [title, setTitle] = useState<string | null>(null);
    const [content, setContent] = useState<string | null>(null);
    const [links, setLinks] = useState<{ title: string }[]>([]); // ? : TS6133: links is declared but its value is never read.
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWikipediaPage = async () => {
            const url = `https://fr.wikipedia.org/w/api.php?action=query&prop=extracts|links&format=json&explaintext&pageids=${encodeURIComponent(pageId)}&origin=*`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error.info);
                }

                // Récupérer le titre, le contenu et les liens de la page
                const page = data.query.pages[pageId];
                if (!page) {
                    throw new Error('Page non trouvée.');
                }

                setTitle(page.title);
                setLinks(page.links || []);

                // Formater le contenu avec des balises <h1>, <h2>, <p> et intégrer les liens
                const formattedContent = formatContent(page.extract, page.links || []);
                //setContent(page.extract); // Afficher le contenu brut
                setContent(formattedContent);
            } catch (error) {
                setError(error instanceof Error ? error.message : 'Une erreur est survenue.');
            } finally {
                setLoading(false);
            }
        };

        fetchWikipediaPage();
    }, [pageId]);

    // Fonction pour formater le contenu et intégrer les liens
    const formatContent = (text: string, links: { title: string }[]): string => {
        // Remplacer les ==Titre== par <h1>Titre</h1>
        text = text.replace(/==(.*?)==/g, '<h1>$1</h1>');
        // Remplacer les ===Sous-titre=== par <h2>Sous-titre</h2>
        text = text.replace(/===(.*?)===/g, '<h2>$1</h2>');
        // Ajouter des balises <p> autour des paragraphes
        text = text.replace(/(\n\n+)/g, '</p><p>');
        // Intégrer les liens dans le contenu
        text = integrateLinks(text, links);
        return `<p>${text}</p>`;
    };

    // Fonction pour intégrer les liens dans le contenu
    const integrateLinks = (text: string, links: { title: string }[]): string => {
        links.forEach(link => {
            const regex = new RegExp(`\\b${link.title}\\b`, 'g');
            text = text.replace(regex, `<a href="http://localhost:5173/game/${
                getIdFromTitle(link.title)
            }">${link.title}</a>`);
        });
        return text;
    };

    if (loading) {
        return <div className="loading">Chargement en cours...</div>;
    }

    if (error) {
        return <div className="error">Erreur : {error}</div>;
    }

    return (
      <div className="wiki-container fade-in">
          {title && <h1 className="wiki-title">{title}</h1>}
          {content && (
            <div
              className="wiki-content"
              dangerouslySetInnerHTML={{ __html: content }} // Injecte le HTML brut dans la page
            />
          )}
      </div>
    );
};

export default WikiView;