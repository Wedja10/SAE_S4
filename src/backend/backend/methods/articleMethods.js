import Article from "../models/Article.js";
import mongoose from "mongoose";
import Game from "../models/Game.js";



export const createArticle = async (title, popularity) => {
    try {
        const newArticle = new Article({ title, popularity });
        return await newArticle.save();
    } catch (error) {
        console.error("Erreur dans createArticle :", error);
        return null; // <-- Actuellement, tu retournes peut-être undefined !
    }
};

export const createGame = async (req, res) => {
    try {
        const { title, genre, rating } = req.body;

        // Vérifier les données reçues
        if (!title || !genre) {
            return res.status(400).json({ message: "Titre et genre sont obligatoires" });
        }

        const newGame = new Game({ title, genre, rating });
        const savedGame = await newGame.save();
        res.status(201).json(savedGame);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de l'ajout du jeu" });
    }
};