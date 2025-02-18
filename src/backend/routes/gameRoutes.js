import express from "express";
import {getVisitedArticlesPlayer, createGame, getGamePlayers, changeArticle, distributeRandomArticles} from "../methods/gameMethods.js";

const router = express.Router();

router.get("/:id_game/players", getGamePlayers);
router.post("/", createGame);  // Route pour ajouter un jeu
router.get('/:id_game/:id_player/articles', getVisitedArticlesPlayer);
router.put("/:id_game/:id_player/article/:id_article", changeArticle);
router.put("/:id_game/:number/random", distributeRandomArticles);

export default router;
