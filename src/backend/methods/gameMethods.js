import Game from "../models/Game.js";
import Player from "../models/Player.js";
import Article from "../models/Article.js";

// Récupérer tous les joueurs d'une partie spécifique
export const getGamePlayers = async (req, res) => {
    try {
        // Récupérer le code du jeu depuis les paramètres de la requête
        const { code } = req.params;
        if (!code) {
            return res.status(400).json({ message: "Le code du jeu est requis." });
        }
        const players = await Player.find({ current_game: code });

        if (players.length === 0) {
            return res.status(404).json({ message: "Aucun joueur trouvé pour ce jeu." });
        }
        res.status(200).json(players);
    } catch (error) {
        console.error("Erreur dans getGamePlayers :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const getArticlesPlayer = async (req, res) => {
    try {
        // Récupérer l'ID du joueur depuis les paramètres de la requête
        const { id } = req.params;

        // Vérifier si l'ID est fourni
        if (!id) {
            return res.status(400).json({ message: "L'ID du joueur est requis." });
        }

        // Trouver le joueur par son ID
        const player = await Player.findById(id);

        // Si le joueur n'est pas trouvé, renvoyer une erreur 404
        if (!player) {
            return res.status(404).json({ message: "Joueur non trouvé." });
        }

        // Extraire tous les articles visités (en combinant tous les tableaux articles_visited de l'historique)
        const articlesVisited = player.history.flatMap(entry => entry.articles_visited);

        // Si aucun article n'a été visité, renvoyer un tableau vide
        if (articlesVisited.length === 0) {
            return res.status(200).json([]);
        }

        // Trouver les articles dont le titre est dans la liste des articles visités
        const articles = await Article.find({ title: { $in: articlesVisited } });

        // Renvoyer les articles trouvés
        res.status(200).json(articles);
    } catch (error) {
        console.error("Erreur dans getArticlesPlayer :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Ajouter un jeu
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
