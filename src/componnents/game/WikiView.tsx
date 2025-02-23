import React from "react";
import { useParams } from "react-router-dom";
import "../../style/game/WikiView.css";

const WikiView: React.FC = () => {
  const { title } = useParams<{ title: string }>();
  const wikiUrl = `https://fr.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title || "")}`;

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
