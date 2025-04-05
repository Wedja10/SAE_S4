import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./view/Home";
import Game from "./view/Game";
import Lobby from "./view/Lobby.tsx";
import Choice from "./view/Choice.tsx";
import LobbySolo from "./view/LobbySolo.tsx";
import Leaderboard from "./view/Leaderboard.tsx";
import Joinlobby from "./componnents/lobby/Joinlobby.tsx";

const AppRouter: React.FC = () => {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game/:gameCode" element={<Game solo={true} />} />
                <Route path="/gameSolo" element={<Game solo={false} />} />
                <Route path="/lobby/:gameCode" element={<Lobby />} />
                <Route path="/join/:gameCode" element={<Joinlobby />} />
                <Route path="/lobbySolo" element={<LobbySolo />} />
                <Route path={"/choice"} element={<Choice />} />
                <Route path={"/leaderboard"} element={<Leaderboard />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;