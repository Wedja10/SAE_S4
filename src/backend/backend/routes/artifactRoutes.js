import express from "express";
import Artifact from "../models/Artifact.js";

const router = express.Router();

// Route GET pour récupérer tous les artifacts
router.get("/", async (_req, res) => {
    try {
        const artifacts = await Artifact.find(); // Récupère tous les artifacts
        res.json(artifacts);

    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des artifacts" });
    }
});

export default router;
