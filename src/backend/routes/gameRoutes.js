import express from "express";
import {getVisitedArticlesPlayer, createGame, getGamePlayers, backArtifact, distributeRandomArticles, getFoundTargetArticles, getArticfactPlayer} from "../methods/gameMethods.js";

const router = express.Router();

router.get("/:id_game/players", getGamePlayers);
router.get('/:id_game/:id_player/articles', getVisitedArticlesPlayer);
router.get('/:id_game/:id_player/TargetArticles', getFoundTargetArticles);
router.get('/:id_game/:id_player/artifacts', getArticfactPlayer);

router.put("/:id_game/:number/random", distributeRandomArticles);
router.put("/:id_creator", createGame);
router.put("/:id_game/:id_player/back", backArtifact);

export default router;
