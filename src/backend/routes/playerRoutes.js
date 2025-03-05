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
            pp: `https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${nanoid()}&backgroundColor=transparent`,
            pp_color: '#FFAD80', // Default skin color
            current_game: null,
            history: []
        });

        const savedPlayer = await newPlayer.save();
        res.status(201).json({
            id: savedPlayer._id,
            pseudo: savedPlayer.pseudo,
            pp: savedPlayer.pp,
            pp_color: savedPlayer.pp_color
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

// Update player picture and skin color
router.post("/update-picture", async (req, res) => {
    try {
        const { playerId, newPicture, pp_color } = req.body;
        const player = await Player.findById(playerId);
        
        if (!player) {
            return res.status(404).json({ message: "Player not found" });
        }

        player.pp = newPicture;
        player.pp_color = pp_color || '#FFAD80'; // Ensure we always have a skin color
        await player.save();

        res.json({
            id: player._id,
            pp: player.pp,
            pp_color: player.pp_color
        });
    } catch (error) {
        console.error("Error updating player picture:", error);
        res.status(500).json({ message: "Error updating player picture" });
    }
});

export default router;
