import React from "react";
import '../../style/game/Articles.css';

const Articles: React.FC = () => {
    const articlesToFind = ["Article 1", "Article 2", "Article 3", "Article 4", "Article 5", "Article 2", "Article 2", "Article 2"];
    const visitedArticles = ["Article 1", "Article 2", "Article 3", "Article 3", "Article 3", "Article 3", "Article 3", "Article 3", "Article 3"];
  
    return (
      <div className="articles-container">
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
