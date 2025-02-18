import express from "express";
import {getVisitedArticlesPlayer, createGame, getGamePlayers, changeArticle, distributeRandomArticles, getFoundTargetArticles, getArticfactPlayer} from "../methods/gameMethods.js";

const router = express.Router();
router.post("/", createGame);

router.get("/:id_game/players", getGamePlayers);
router.get('/:id_game/:id_player/articles', getVisitedArticlesPlayer);
router.get('/:id_game/:id_player/TargetArticles', getFoundTargetArticles);
router.get('/:id_game/:id_player/artifacts', getArticfactPlayer);

router.put("/:id_game/:id_player/article/:id_article", changeArticle);
router.put("/:id_game/:number/random", distributeRandomArticles);


export default router;
