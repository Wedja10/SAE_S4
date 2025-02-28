import Game from "../models/Game.js";
import Player from "../models/Player.js";
import mongoose from "mongoose";

// Créer un nouveau lobby
export const createLobby = async (req, res) => {
    try {
        const { hostId, maxPlayers, timeLimit, articlesNumber, visibility } = req.body;

        // Vérifier que l'hôte existe
        const host = await Player.findById(hostId);
        if (!host) {
            return res.status(404).json({ message: "Hôte non trouvé" });
        }

        // Générer un code de jeu unique
        const gameCode = generateGameCode();

        // Créer un nouveau jeu/lobby
        const newGame = new Game({
            game_code: gameCode,
            status: "waiting",
            start_time: null,
            settings: {
                max_players: maxPlayers || null, // null = illimité
                time_limit: timeLimit || null,
                articles_number: articlesNumber || 5,
                visibility: visibility || "public",
                allow_join: true
            },
            players: [{
                player_id: host._id,
                articles_visited: [],
                current_article: null,
                artifacts: [],
                score: 0,
                is_host: true
            }]
        });

        await newGame.save();
        return res.status(201).json({
            game_code: gameCode,
            message: "Lobby créé avec succès"
        });

    } catch (error) {
        console.error("Erreur lors de la création du lobby:", error);
        return res.status(500).json({ message: "Erreur lors de la création du lobby" });
    }
};

// Rejoindre un lobby existant
export const joinLobby = async (req, res) => {
    try {
        const { gameCode, playerId } = req.body;

        // Trouver le jeu
        const game = await Game.findOne({ game_code: gameCode });
        if (!game) {
            return res.status(404).json({ message: "Lobby non trouvé" });
        }

        // Vérifier si le lobby accepte les nouveaux joueurs
        if (!game.settings.allow_join) {
            return res.status(403).json({ message: "Le lobby n'accepte plus de nouveaux joueurs" });
        }

        // Vérifier si le jeu est complet
        if (game.settings?.max_players && game.players.length >= game.settings.max_players) {
            return res.status(400).json({ message: "Lobby complet" });
        }

        // Vérifier si le joueur existe
        const player = await Player.findById(playerId);
        if (!player) {
            return res.status(404).json({ message: "Joueur non trouvé" });
        }

        // Vérifier si le joueur est déjà dans le jeu
        if (game.players.some(p => p.player_id.equals(playerId))) {
            return res.status(400).json({ message: "Joueur déjà dans le lobby" });
        }

        // Ajouter le joueur au jeu
        game.players.push({
            player_id: player._id,
            articles_visited: [],
            current_article: null,
            artifacts: [],
            score: 0,
            is_host: false
        });

        await game.save();
        return res.status(200).json({ message: "Lobby rejoint avec succès" });

    } catch (error) {
        console.error("Erreur lors de la jonction au lobby:", error);
        return res.status(500).json({ message: "Erreur lors de la jonction au lobby" });
    }
};

// Obtenir les informations du lobby
export const getLobbyInfo = async (req, res) => {
    try {
        const { gameCode } = req.params;

        const game = await Game.findOne({ game_code: gameCode })
            .populate('players.player_id', 'pseudo pp');

        if (!game) {
            return res.status(404).json({ message: "Lobby non trouvé" });
        }

        // Formater les informations des joueurs
        const players = game.players.map(player => ({
            id: player.player_id._id,
            pseudo: player.player_id.pseudo,
            pp: player.player_id.pp,
            is_host: player.is_host
        }));

        return res.status(200).json({
            game_code: game.game_code,
            status: game.status,
            settings: game.settings,
            players: players
        });

    } catch (error) {
        console.error("Erreur lors de la récupération des informations du lobby:", error);
        return res.status(500).json({ message: "Erreur lors de la récupération des informations du lobby" });
    }
};

// Quitter le lobby
export const leaveLobby = async (req, res) => {
    try {
        const { gameCode, playerId } = req.body;

        const game = await Game.findOne({ game_code: gameCode });
        if (!game) {
            return res.status(404).json({ message: "Lobby non trouvé" });
        }

        // Retirer le joueur du jeu
        game.players = game.players.filter(p => !p.player_id.equals(playerId));

        // Si aucun joueur ne reste, supprimer le lobby
        if (game.players.length === 0) {
            await Game.deleteOne({ _id: game._id });
            return res.status(200).json({ message: "Lobby fermé - aucun joueur restant" });
        }

        // Si l'hôte quitte, assigner un nouvel hôte
        const leavingPlayer = game.players.find(p => p.player_id.equals(playerId));
        if (leavingPlayer?.is_host && game.players.length > 0) {
            game.players[0].is_host = true;
        }

        await game.save();
        return res.status(200).json({ message: "Lobby quitté avec succès" });

    } catch (error) {
        console.error("Erreur lors de la sortie du lobby:", error);
        return res.status(500).json({ message: "Erreur lors de la sortie du lobby" });
    }
};

// Mettre à jour les paramètres du lobby
export const updateLobbySettings = async (req, res) => {
    try {
        const { gameCode, maxPlayers, timeLimit, articlesNumber, visibility, allowJoin } = req.body;

        const game = await Game.findOne({ game_code: gameCode });
        if (!game) {
            return res.status(404).json({ message: "Lobby non trouvé" });
        }

        // Mettre à jour les paramètres
        game.settings = {
            ...game.settings,
            max_players: maxPlayers !== undefined ? maxPlayers : game.settings?.max_players,
            time_limit: timeLimit !== undefined ? timeLimit : game.settings?.time_limit,
            articles_number: articlesNumber !== undefined ? articlesNumber : game.settings?.articles_number,
            visibility: visibility || game.settings?.visibility,
            allow_join: allowJoin !== undefined ? allowJoin : game.settings?.allow_join
        };

        await game.save();
        return res.status(200).json({
            message: "Paramètres du lobby mis à jour",
            settings: game.settings
        });

    } catch (error) {
        console.error("Erreur lors de la mise à jour des paramètres du lobby:", error);
        return res.status(500).json({ message: "Erreur lors de la mise à jour des paramètres du lobby" });
    }
};

// Fonction pour générer un code de jeu unique
function generateGameCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
