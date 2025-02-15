import express from "express";
import {getArticlesPlayer, createGame, getGamePlayers} from "../methods/gameMethods.js";

const router = express.Router();

router.get("/:code/players", getGamePlayers);
router.post("/", createGame);  // Route pour ajouter un jeu
router.get('/players/:id/articles', getArticlesPlayer);

export default router;
