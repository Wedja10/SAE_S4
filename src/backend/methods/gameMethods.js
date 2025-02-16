import Game from "../models/Game.js";
import mongoose from "mongoose";

// Récupérer tous les joueurs d'une partie spécifique
export const getGamePlayers = async (req, res) => {
    try {
        const { id_game } = req.params;
        if (!id_game) {
            return res.status(400).json({ message: "L'ID du jeu est requis." });
        }

        // Attendre la récupération du jeu
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        // Extraire les IDs des joueurs
        const playerIds = game.players.map(player => player.player_id);

        if (playerIds.length === 0) {
            return res.status(404).json({ message: "Aucun joueur trouvé pour ce jeu." });
        }

        // Retourner la liste des IDs des joueurs
        res.status(200).json(playerIds);
    } catch (error) {
        console.error("Erreur dans getGamePlayers :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

export const changeArticle = async (req, res) => {
    try {
        const { id_game, id_player, id_article } = req.params;

        if (!id_game || !id_player || !id_article) {
            return res.status(400).json({ message: "Tous les identifiants sont requis." });
        }

        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        const playerIds = game.players.map(player => player.player_id.toString()); // Convert player_id to string
        const playerObjectId = new mongoose.Types.ObjectId(id_player);

        const player = game.players.find(p => p.player_id.toString() === playerObjectId.toString()); // Convert both to string for comparison
        if (!player) {
            return res.status(404).json({ message: "Joueur non trouvé", playerObjectId, playerIds });
        }

        // Vérifie si le joueur a un article en cours
        if (!player.current_article) {
            return res.status(400).json({ message: "Aucun article actuel trouvé." });
        }

        // Ajouter l'article actuel dans visited_articles
        player.articles_visited = player.articles_visited || []; // Assure que visited_articles existe
        player.articles_visited.push(player.current_article);

        // Mettre à jour current_article avec le nouvel id_article
        player.current_article = id_article;

        // Sauvegarder les modifications
        await game.save();

        res.status(200).json({ message: "Article changé avec succès.", id_article });

    } catch (error) {
        console.error("Erreur dans changeArticle :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

// Récupére tous les articles visités d'un joueur dans une partie
export const getVisitedArticlesPlayer = async (req, res) => {
    try {
        const { id_game, id_player } = req.params;

        if (!id_game || !id_player) {
            return res.status(400).json({ message: "Les IDs du jeu et du joueur sont requis." });
        }

        // Récupération du jeu
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        // Convertir l'ID du joueur en ObjectId pour la comparaison
        const playerObjectId = new mongoose.Types.ObjectId(id_player);

        // Trouver le joueur correspondant en utilisant player_id
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            console.log("Joueurs trouvés dans le jeu :", game.players);
            return res.status(404).json({ message: "Joueur non trouvé dans ce jeu." });
        }

        // Récupérer les articles visités par ce joueur
        const visitedArticles = player.articles_visited || [];
        res.status(200).json(visitedArticles);
    } catch (error) {
        console.error("Erreur dans getVisitedArticlesPlayer :", error);
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
