import express from "express";
import Player from "../models/Player";

const router = express.Router();

// Route GET pour récupérer tous les utilisateurs
router.get("/", async (_req, res) => {
    try {
        const players = await Player.find(); // Récupère tous les utilisateurs
        res.json(players);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
});

export default router;
