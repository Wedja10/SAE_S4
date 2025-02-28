import express from "express";
import Player from "../models/Player.js";
import { nanoid } from 'nanoid';

const router = express.Router();

// Generate a random username
const generateUsername = () => {
    const adjectives = ['Swift', 'Clever', 'Brave', 'Mighty', 'Noble', 'Wise', 'Quick', 'Bold'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Wolf', 'Bear', 'Lion', 'Fox', 'Hawk'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);
    
    return `${adjective}${noun}${number}`;
};

// Create a new player
router.post("/create", async (req, res) => {
    try {
        const newPlayer = new Player({
            pseudo: generateUsername(),
            pp: `https://api.dicebear.com/7.x/bottts/svg?seed=${nanoid()}`, // Generate random avatar
            current_game: null,
            history: []
        });

        const savedPlayer = await newPlayer.save();
        res.status(201).json({
            id: savedPlayer._id,
            pseudo: savedPlayer.pseudo,
            pp: savedPlayer.pp
        });
    } catch (error) {
        console.error("Error creating player:", error);
        res.status(500).json({ message: "Error creating player" });
    }
});

// Route GET pour récupérer tous les utilisateurs
router.get("/", async (_req, res) => {
    try {
        const players = await Player.find();
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des utilisateurs" });
    }
});

export default router;
