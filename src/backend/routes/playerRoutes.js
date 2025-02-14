import * as express from "express";
import Player from "../models/Player.js";

const router = express.Router();

// Route GET pour récupérer tous les utilisateurs
router.get("/", async (_req, res) => {
    try {
        const players = await Player.find(); // Récupère tous les utilisateurs
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
});

export default router;
