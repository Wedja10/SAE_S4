import React from "react";
import '../../style/game/WikiView.css';
import { useEffect, useState } from 'react';

const escapeRegExp = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Échapper les caractères spéciaux
};

const removeAccents = (str: string): string => {
    return str
        .normalize('NFD') // Décompose les caractères accentués en caractères de base + diacritiques
        .replace(/[\u0300-\u036f]/g, ''); // Supprime les diacritiques (accents)
};

const formatLinks = (htmlContent: string): string => {
    // Créer un élément DOM temporaire pour manipuler le HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = htmlContent;

    // Sélectionner tous les liens (<a> tags)
    const links = tempElement.querySelectorAll('a');

    // Tableau pour stocker les liens extraits
    const extractedLinks: Array<{ href: string; text: string }> = [];

    // Parcourir tous les liens
    links.forEach((link) => {
        const href = link.getAttribute('href') || ''; // Récupérer l'attribut href
        const text = link.textContent || ''; // Récupérer le texte du lien

        // Ajouter le lien au tableau
        extractedLinks.push({href, text});
    });

    // Pour chaque lien, remplacer ce qu'il y a entre <a*lien*>texte du lien</a> par <a href="/game/lien">texte du lien</a>
    extractedLinks.forEach(({href, text}) => {
        const escapedHref = escapeRegExp(href); // Échapper les caractères spéciaux dans href
        const escapedText = escapeRegExp(text); // Échapper les caractères spéciaux dans text

        // Créer la regex pour trouver le lien
        const regex = new RegExp(`<a[^>]*href=["']${escapedHref}["'][^>]*>${escapedText}</a>`, 'g');

        // Remplacer le lien par le nouveau format
        htmlContent = htmlContent.replace(regex, `<a href="/game/${removeAccents(href.substring(2))}">${text}</a>`);
    });

    // supprimer <base href="//fr.wikipedia.org/wiki/"/> (casse le css idk why)
    htmlContent = htmlContent.replace(/<base href="\/\/fr.wikipedia.org\/wiki\/"\/>/, '');

    // supprimer tout ce qui est entre <div ... </div>
    htmlContent = htmlContent.replace(/<div[^>]*>.*?<\/div>/g, '');

    return htmlContent;
};

const WikiView: React.FC<{ title: string }> = ({title}) => {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
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
  //const wikiUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}`; // affiche la page wikipedia de base
  const wikiUrl = `https://fr.wikipedia.org/wiki/${encodeURIComponent(articleTitle)}?action=render`; // Pour afficher le contenu de la page directement seulement l'article sans css
  // const wikiUrl = `https://fr.wikipedia.org/w/index.php?title=${encodeURIComponent(articleTitle)}&printable=yes`;


    return (
        <div className="wiki-container fade-in">
            <h1 className="wiki-title">{title.replace("_", " ")}</h1>
            {content && (
                <div
                    className="wiki-content"
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            )}
        </div>
    );
  return (
    <div className="wiki-container fade-in">
      <iframe
        src={wikiUrl}
        title={articleTitle || "Wiki Page"}
        className="wiki-iframe"
      ></iframe>
    </div>
  );
};

export default WikiView;
