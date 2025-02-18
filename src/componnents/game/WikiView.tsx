import React from "react";
import '../../style/game/WikiView.css';
import { useEffect, useState } from 'react';

const formatContent = (rawContent: string): string => {
    let formattedContent = rawContent;

    // remplace '''*''' par <b>*</b>
    const boldRegex = /'''(.*?)'''/g;
    formattedContent = formattedContent.replace(boldRegex, "<b>$1</b>");

    // remplace ''*'' par <i>*</i>
    const italicRegex = /''(.*?)''/g;
    formattedContent = formattedContent.replace(italicRegex, "<i>$1</i>");

    // remplace [[Lien]] par <a href="Lien">Lien</a> and [[Lien|Texte]] par <a href="Lien">Texte</a>
    const linkRegex = /\[\[(.*?)(?:\|(.*?))?\]\]/g;
    formattedContent = formattedContent.replace(linkRegex, (match, link, text) => {
        const linkText = text || link;
        //return `<a href="https://fr.wikipedia.org/wiki/${link}">${linkText}</a>`;
        return `<a href="/game/${link}">${linkText}</a>`;
    });

    return formattedContent;
};

const WikiView: React.FC<{ title: string }> = ({ title }) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWikipediaPage = async () => {
            // URL de l'API Wikipedia pour récupérer le contenu brut (WikiText)
            const url = `https://fr.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&format=json&titles=${encodeURIComponent(title)}&origin=*`;

            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error.info);
                }

                // Récupérer la première page (la clé est dynamique, donc on utilise Object.values)
                const pages = data.query.pages;
                const page = Object.values(pages)[0] as { title?: string; revisions?: { "*": string }[] };

                if (!page || !page.revisions || !page.revisions[0]) {
                    throw new Error("Page non trouvée ou contenu vide.");
                }

                // Récupérer le contenu brut (WikiText)
                const content = page.revisions[0]["*"];
                setContent(formatContent(content));
            } catch (error) {
                setError(error instanceof Error ? error.message : "Une erreur est survenue.");
            } finally {
                setLoading(false);
            }
        };

        fetchWikipediaPage();
    }, [title]);

    if (loading) {
        return <div className="loading">Chargement en cours...</div>;
    }

    if (error) {
        return <div className="error">Erreur : {error}</div>;
    }

    return (
      <div className="wiki-container fade-in">
          <h1 className="wiki-title">{title}</h1>
          {content && (
            <pre className="wiki-raw-content">
                    <code>
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </code>
                </pre>
          )}
      </div>
    );
};

export default WikiView;