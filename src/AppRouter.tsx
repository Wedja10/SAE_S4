import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./view/Home";
import Game from "./view/Game";
import Lobby from "./view/Lobby.tsx";

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/game/:pageId" element={<Game />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;