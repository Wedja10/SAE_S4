import React, { useEffect, useState } from "react";
import '../../style/game/Articles.css';
import "../../backend/services/apiService.js";
import { postRequest } from "C:/wamp64/www/SAE_S4/src/backend/services/apiService.js";

const Articles: React.FC = () => {
    const [visitedArticles, setVisitedArticles] = useState<string[]>([]);
    const [articlesToFind, setArticlesToFind] = useState<string[]>([]);
    const [data, setData] = useState<any>(null);

    const fetchTargetArticles = async () => {
        const data = await postRequest('http://localhost:3000/games/target-articles', {
            id_game: "67b1f4c36fe85f560dd86791"
        });
        setData(data);
        setArticlesToFind(data);
    };

    const postVisitedArticles = async () => {
        const data = await postRequest('http://localhost:3000/games/articles', {
            id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"
        });
        setData(data);
        setVisitedArticles(data);
    };

    useEffect(() => {
        fetchTargetArticles();
        postVisitedArticles();
    }, []);


    return (
        <div className="articles-container fade-in">
            <div>
                <h2 className="articles-title">Articles à Trouver</h2>
                <ul className="articles-list">
                    {articlesToFind.map((article, index) => (
                        <React.Fragment key={index}>
                            <li className="article-item article-to-find">{article}</li>
                            <hr />
                        </React.Fragment>
                    ))}
                </ul>
            </div>

            <div>
                <h2 className="articles-title">Articles Visités</h2>
                <ul className="articles-list">
                    {visitedArticles.map((article, index) => (
                        <React.Fragment key={index}>
                            <li className="article-item article-visited">{article}</li>
                            <hr />
                        </React.Fragment>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Articles;
