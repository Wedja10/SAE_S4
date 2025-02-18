import express from "express";
import Article from "../models/Article.js";

const router = express.Router();

// Route GET pour récupérer tous les articles
router.get("/", async (_req, res) => {
    try {
        const articles = await Article.find(); // Récupère tous les articles
        res.json(articles);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des articles" });
    }
});

export default router;
