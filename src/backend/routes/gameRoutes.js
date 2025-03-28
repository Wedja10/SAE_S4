import express from "express";
import {
    getVisitedArticlesPlayer,
    eraserArtifact,
    createGame,
    getPlayersInGame,
    changeArticleFront,
    distributeRandomArticles,
    getTargetArticles,
    getCurrentArticle,
    getArticfactPlayer,
    mineArtifact,
    disorienterArtifact,
    dictatorArtifact,
    teleporterArtifact,
    backArtifact,
    distributeArtifacts,
    getFoundTargetArticles,
    getPublicGames,
    getStorableArticfactPlayer,
    setMineArtifacts,
    fetchLeaderBoard
} from "../methods/gameMethods.js";
import { joinLobby } from "../methods/lobbyMethods.js";
import Game from "../models/Game.js";

const router = express.Router();

// Get lobby data
router.get("/lobby/:gameCode", async (req, res) => {
    try {
        const { gameCode } = req.params;
        const game = await Game.findOne({ game_code: gameCode }).populate('players.player_id');
        
        if (!game) {
            return res.status(404).json({ 
                message: "Lobby not found",
                error: "LOBBY_NOT_FOUND"
            });
        }

        // Transform player data to match the expected format in the frontend
        const players = game.players.map(player => ({
            id: player.player_id._id.toString(),
            pseudo: player.player_id.pseudo || "Player",
            pp: player.player_id.pp || "",
            is_host: player.is_host
        }));

        console.log('Transformed players:', players);

        res.json({
            players: players,
            settings: game.settings
        });
    } catch (error) {
        console.error("Error fetching lobby data:", error);
        res.status(500).json({ 
            message: "Error fetching lobby data",
            error: "SERVER_ERROR"
        });
    }
});

router.post("/players", getPlayersInGame);
router.post("/current-article", getCurrentArticle);
router.post('/articles', getVisitedArticlesPlayer);
router.post('/target-articles', getTargetArticles);
router.post('/found-target-articles', getFoundTargetArticles);
router.post('/artifacts', getArticfactPlayer);
router.post('/storable-artifacts', getStorableArticfactPlayer);
router.post('/change-article', changeArticleFront);
router.post('/public-games', getPublicGames);
router.post("/random-articles", distributeRandomArticles);
router.post("/create-game", createGame);
router.post("/back-artifact", backArtifact);
router.post("/mine-artifact", mineArtifact);
router.post("/set-mine", setMineArtifacts);
router.post("/eraser-artifact", eraserArtifact);
router.post("/disorienter-artifact", disorienterArtifact);
router.post("/dictator-artifact", dictatorArtifact);
router.post("/teleporter-artifact", teleporterArtifact);
router.post("/join", joinLobby);
router.post("/distribute-artifacts", distributeArtifacts);
router.post("/leaderBoard", fetchLeaderBoard);

export default router;
