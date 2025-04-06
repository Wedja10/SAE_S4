import express from "express";
import Challenge from "../models/Challenge.js";
import {destinationArticleChallenge} from "../methods/challengesMethods.js";

const router = express.Router();

// Route GET pour récupérer tous les challenges
router.get("/", async (_req, res) => {
    try {
        const challenges = await Challenge.find(); // Récupère tous les challenges
        res.json(challenges);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des challenges" });
    }
});

router.post("/create-challenge", destinationArticleChallenge);

export default router;
