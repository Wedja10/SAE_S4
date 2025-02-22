import express from "express";
import {
    getVisitedArticlesPlayer,
    eraserArtifact,
    createGame,
    getGamePlayers,
    backArtifact,
    distributeRandomArticles,
    getFoundTargetArticles,
    getArticfactPlayer,
    mineArtifact,
    disorienterArtifact,
    dictatorArtifact,
    teleporterArtifact,
    getTargetArticles
} from "../methods/gameMethods.js";

const router = express.Router();

router.post("/players", getGamePlayers);
router.post('/articles', getVisitedArticlesPlayer);
router.post('/target-articles', getTargetArticles);
router.post('/found-articles', getFoundTargetArticles);
router.post('/artifacts', getArticfactPlayer);
router.post("/random-articles", distributeRandomArticles);
router.post("/create-game", createGame);
router.post("/back-artifact", backArtifact);
router.post("/mine-artifact", mineArtifact);
router.post("/eraser-artifact", eraserArtifact);
router.post("/disorienter-artifact", disorienterArtifact);
router.post("/dictator-artifact", dictatorArtifact);
router.post("/teleporter-artifact", teleporterArtifact);

export default router;
