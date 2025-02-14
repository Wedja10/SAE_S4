import express from "express";
import Game from "../models/Game.js";

const router = express.Router();

// Route GET pour récupérer tous les games
router.get("/", async (_req, res) => {
    try {
        const artifacts = await Game.find(); // Récupère tous les games
        res.json(artifacts);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des games" });
    }
});

export default router;
