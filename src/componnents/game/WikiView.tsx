import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../../style/game/WikiView.css";

const WikiView: React.FC = () => {
    const { title } = useParams<{ title: string }>();
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

    const wikiUrl = `http://wikipedia/api/rest_v1/page/html/${encodeURIComponent(title || "")}`;

    return (
        <div className="wiki-container fade-in">
            <h1 className="wiki-title">{(title || "").replace("_", " ")}</h1>
            <iframe
                src={wikiUrl}
                title={title || "Wiki Page"}
                className="wiki-iframe"
            ></iframe>
        </div>
    );
};

export default WikiView;
