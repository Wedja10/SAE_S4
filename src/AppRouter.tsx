import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./view/Home";
import Game from "./view/Game";
import Lobby from "./view/Lobby.tsx";
import Choice from "./view/Choice.tsx";
import LobbySolo from "./view/LobbySolo.tsx";

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/lobby/:gameCode" element={<Lobby />} />
                <Route path="/lobbySolo" element={<LobbySolo />} />
                <Route path={"/choice"} element={<Choice />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;