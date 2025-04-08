import Game from "../models/Game.js";
import mongoose from "mongoose";
import "./articleMethods.js";
import Player from "../models/Player.js";
import Article from "../models/Article.js";
import Artifact from "../models/Artifact.js";
import {createArticle, generateRandomArticle} from "./articleMethods.js";
import artifact from "../models/Artifact.js";
import Challenge from "../models/Challenge.js";

const { ObjectId } = mongoose.Types;

export const gameExists = async (gameId) => {
    const game = await Game.findById(gameId);
    return !!game;
};

export const playerExistsInGame = async (gameId, playerId) => {
    const game = await Game.findById(gameId);
    if (!game) return false;

    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    return game.players.some(p => p.player_id.equals(playerObjectId));
};

export const playerHasCurrentArticle = async (gameId, playerId) => {
    const game = await Game.findById(gameId);
    if (!game) return false;

    const playerObjectId = new mongoose.Types.ObjectId(playerId);
    const player = game.players.find(p => p.player_id.equals(playerObjectId));
    return player ? !!player.current_article : false;
};

export const getPlayersInGame = async (req, res) => {
    try {
        const { id_game } = req.body;

        if (!id_game) {
            return res.status(400).json({ error: "Game ID is required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Get players with their scores
        const playersWithScores = await Promise.all(
            game.players.map(async (playerInfo) => {
                try {
                    const player = await Player.findById(playerInfo.player_id);
                    if (!player) return null;

                    // Fetch visited article titles
                    let visited = [];
                    if (Array.isArray(playerInfo.articles_visited)) {
                        visited = await Promise.all(
                            playerInfo.articles_visited.map(async (articleId) => {
                                const article = await Article.findById(articleId);
                                return article ? article.title : null;
                            })
                        );
                    }

                    // Calculate score
                    const targetArticleIds = new Set(game.articles_to_visit.map(id => id.toString()));
                    const score = (playerInfo.articles_visited || []).filter(id => targetArticleIds.has(id.toString())).length;

                    return {
                        id: player._id.toString(),
                        pseudo: player.pseudo || "Player",
                        pp: player.pp || "",
                        score,
                        articles_visited: visited.filter(title => title !== null) // Remove null values
                    };
                } catch (err) {
                    console.error("Error processing player:", err);
                    return null;
                }
            })
        );

        // Filter out null values
        return res.status(200).json(playersWithScores.filter(player => player !== null));
    } catch (error) {
        console.error("Error in getPlayersInGame:", error);
        return res.status(500).json({ error: "Server error" });
    }
};


// Get found target articles for a player
export const getFoundTargetArticles = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        console.log(`Getting found target articles for player ${id_player} in game ${id_game}`);

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            console.log(`Game not found: ${id_game}`);
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            console.log(`Invalid player ID format: ${id_player}`);
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id && p.player_id.equals(playerObjectId));
        if (!player) {
            console.log(`Player ${id_player} not found in game ${id_game}`);
            return res.status(404).json({ error: "Player not found in this game" });
        }

        // Check if player has found_target_articles field
        if (player.found_target_articles && Array.isArray(player.found_target_articles) && player.found_target_articles.length > 0) {
            console.log(`Player ${id_player} has ${player.found_target_articles.length} found target articles`);

            // Get article titles from IDs
            const articles = await Promise.all(
                player.found_target_articles.map(async (id) => {
                    try {
                        if (!id) return null;
                        const article = await Article.findById(id.toString());
                        return article ? article.title : null;
                    } catch (err) {
                        console.error(`Error finding article with ID ${id}:`, err);
                        return null;
                    }
                })
            );

            // Filter out null values
            const validArticles = articles.filter(article => article !== null);
            console.log(`Returning ${validArticles.length} valid found target articles`);

            return res.status(200).json(validArticles);
        }

        // If no found_target_articles field or it's empty, fall back to the old method
        // If no visited articles, return empty array
        if (!player.articles_visited || !Array.isArray(player.articles_visited) || player.articles_visited.length === 0) {
            console.log(`No visited articles for player ${id_player}`);
            return res.status(200).json([]);
        }

        // If no target articles, return empty array
        if (!game.articles_to_visit || !Array.isArray(game.articles_to_visit) || game.articles_to_visit.length === 0) {
            console.log(`No target articles for game ${id_game}`);
            return res.status(200).json([]);
        }

        console.log(`Finding target articles that player ${id_player} has visited`);

        // Convert visited article IDs to strings for comparison
        const visitedArticleIds = player.articles_visited.map(id => id.toString());

        // Convert target article IDs to strings for comparison
        const targetArticleIds = game.articles_to_visit.map(id => id.toString());

        // Find intersection of visited and target article IDs
        const foundTargetIds = visitedArticleIds.filter(id => targetArticleIds.includes(id));

        if (foundTargetIds.length === 0) {
            console.log(`Player ${id_player} has not found any target articles yet`);
            return res.status(200).json([]);
        }

        console.log(`Player ${id_player} has found ${foundTargetIds.length} target articles (using fallback method)`);

        // Get article titles from IDs
        const articles = await Promise.all(
            foundTargetIds.map(async (id) => {
                try {
                    if (!id) return null;
                    const article = await Article.findById(id);
                    return article ? article.title : null;
                } catch (err) {
                    console.error(`Error finding article with ID ${id}:`, err);
                    return null;
                }
            })
        );

        // Filter out null values
        const validArticles = articles.filter(article => article !== null);
        console.log(`Returning ${validArticles.length} valid found target articles`);

        return res.status(200).json(validArticles);
    } catch (error) {
        console.error("Error in getFoundTargetArticles:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};

export const getCurrentArticle = async (req, res) => {
    const {id_game, id_player} = req.body;

    try {
        // Validate that IDs are provided
        if (!id_game || !id_player) {
            return res.status(400).json({message: "Game ID and Player ID are required"});
        }

        // Try to find the game by ID or game code
        let game;

        // Check if id_game is a valid ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(id_game)) {
            game = await Game.findById(id_game);
        } else {
            // If not a valid ObjectId, try to find by game code
            game = await Game.findOne({ game_code: id_game });
        }

        if (!game) {
            return res.status(404).json({message: "Jeu non trouvé"});
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({message: "Invalid Player ID format"});
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({message: "Joueur non trouvé"});
        }

        if (!player.current_article) {
            return res.status(200).json(null);
        }

        const current = await Article.findById(player.current_article.toString());
        if (!current) {
            return res.status(200).json(null);
        }

        return res.status(200).json(current.title);
    } catch (error) {
        console.error('Erreur dans getCurrentArticle:', error);
        return res.status(500).json({message: "Erreur serveur"});
    }
};


// Helper function to check if an article is a target article
const checkTargetArticleFound = async (game, articleId, playerId, isDictate) => {
    try {
        if (!game || !articleId || !playerId) {
            console.log("Missing parameters in checkTargetArticleFound");
            return false;
        }

        // Convert IDs to strings for comparison
        const articleIdStr = articleId.toString();

        // Check if article is in target articles
        if (game.articles_to_visit && Array.isArray(game.articles_to_visit)) {
            const isTargetArticle = game.articles_to_visit.some(
                targetId => targetId && targetId.toString() === articleIdStr
            );

            if (isTargetArticle) {
                const article = await Article.findById(articleId);
                const articleTitle = article ? article.title : "Unknown article";
                console.log(`Player ${playerId} found a target article: ${articleTitle}`);

                // Find the player in the game
                const playerIndex = game.players.findIndex(p =>
                    p.player_id && p.player_id.toString() === playerId.toString()
                );

                if (playerIndex !== -1) {
                    // Initialize found_target_articles if it doesn't exist
                    if (!game.players[playerIndex].found_target_articles) {
                        game.players[playerIndex].found_target_articles = [];
                    }

                    // Check if this target article is already in the found list
                    const alreadyFound = game.players[playerIndex].found_target_articles.some(
                        foundId => foundId && foundId.toString() === articleIdStr
                    );

                    if (!alreadyFound) {
                        // Add to found target articles
                        if(isDictate && game.players[playerIndex].dictateArticle && game.players[playerIndex].dictateArticle === article.title){
                            game.players[playerIndex].found_target_articles.push(articleId);
                            game.players[playerIndex].dictateArticle = "";
                            console.log(`Added ${articleTitle} to player's found target articles`);
                        }
                        if(!isDictate){
                            game.players[playerIndex].found_target_articles.push(articleId);
                            game.players[playerIndex].dictateArticle = "";
                            console.log(`Added ${articleTitle} to player's found target articles`);
                        }
                        await game.save();
                    }
                }

                return true;
            }
        }

        return false;
    } catch (error) {
        console.error("Error in checkTargetArticleFound:", error);
        return false;
    }
};

export const changeArticle = async (gameId, playerId, articleId) => {
    if (!gameId || !playerId || !articleId) {
        throw new Error("Tous les identifiants sont requis.");
    }

    if (!await gameExists(gameId)) {
        throw new Error("Jeu non trouvé.");
    }

    if (!await playerExistsInGame(gameId, playerId)) {
        throw new Error("Joueur non trouvé dans ce jeu.");
    }

    if (!await playerHasCurrentArticle(gameId, playerId)) {
        throw new Error("Aucun article actuel trouvé.");
    }

    const game = await Game.findById(gameId);
    const player = game.players.find(p => p.player_id.equals(playerId));

    player.articles_visited = player.articles_visited || [];
    player.current_article = articleId;
    player.articles_visited.push(player.current_article);

    const isTargetArticle = await checkTargetArticleFound(game, articleId, playerId);

    await game.save();

    return { message: "Article changé avec succès.", id_article: articleId };
};



// Update the changeArticleFront function to use the helper
export const changeArticleFront = async (req, res) => {
    try {
        const { id_game, id_player, articleId, isDictate } = req.body;

        if (!id_game || !id_player || !articleId) {
            return res.status(400).json({ error: "Game ID, Player ID, and Article ID are required" });
        }

        console.log(`Changing article for player ${id_player} in game ${id_game} to article ${articleId}`);

        // Trouver la partie
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            console.log(`Game not found: ${id_game}`);
            return res.status(404).json({ error: "Game not found" });
        }

        // Vérifier le format des IDs
        if (!/^[0-9a-fA-F]{24}$/.test(id_player) || !/^[0-9a-fA-F]{24}$/.test(articleId)) {
            console.log(`Invalid ID format`);
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const articleObjectId = new mongoose.Types.ObjectId(articleId);

        // Trouver le joueur dans la partie
        const playerIndex = game.players.findIndex(p => p.player_id && p.player_id.equals(playerObjectId));
        if (playerIndex === -1) {
            console.log(`Player ${id_player} not found in game ${id_game}`);
            return res.status(404).json({ error: "Player not found in this game" });
        }

        // Vérifier si l'article existe
        const article = await Article.findById(articleObjectId);
        if (!article) {
            console.log(`Article ${articleId} not found`);
            return res.status(404).json({ error: "Article not found" });
        }

        // 🔥 Vérifier les liens sortants via l'API externe
        let hasOutgoingLinks = false;
        const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=links&titles=${encodeURIComponent(article.title)}&format=json&origin=*`;

        try {
            const response = await fetch(wikipediaApiUrl);
            const data = await response.json();

            const pageId = Object.keys(data.query.pages)[0]; // Récupérer l'ID de la page
            const links = data.query.pages[pageId].links || []; // Récupérer les liens

            hasOutgoingLinks = links.length > 0;
        } catch (error) {
            console.error("Erreur lors de la récupération des liens sortants:", error);
        }


        // Mise à jour de l'article actuel du joueur
        game.players[playerIndex].current_article = articleObjectId;

        // Ajouter l'article aux articles visités
        if (!game.players[playerIndex].articles_visited) {
            game.players[playerIndex].articles_visited = [];
        }
        game.players[playerIndex].articles_visited.push(articleObjectId);

        // Vérifier si l'article est une cible
        const isTargetArticle = await checkTargetArticleFound(game, articleObjectId, playerObjectId, isDictate);
        const diceRoll = Math.floor(Math.random() * 6) + 1;

        let setArtifact = null;

        if (!hasOutgoingLinks) {
            console.log(`Article ${article.title} has no outgoing links, assigning "Backtrack" artifact`);
            setArtifact = "Backtrack";
        } else if (diceRoll === 1) {
            setArtifact = await setArtifactDistribution(id_game, article.title);
            game.players[playerIndex].artifacts.push(setArtifact);
        }

        let isLastArticle = game.articles_to_visit.length === game.players[playerIndex].found_target_articles.length;
        let isMinedArticle = game.mined_article && game.mined_article.includes(article.title);

        // Mettre à jour la partie en base de données
        await Game.findOneAndUpdate({ _id: game._id }, game, { new: true, runValidators: false });

        console.log(`Successfully updated current article for player ${id_player} to ${article.title}`);

        return res.status(200).json({
            message: "Article changed successfully",
            id_article: articleId,
            title: article.title,
            isNewVisit: true,
            isTargetArticle,
            isLastArticle,
            isMinedArticle,
            artifact: setArtifact,
            targetArticlesFound: game.players[playerIndex].found_target_articles.length
        });
    } catch (error) {
        console.error("Error in changeArticleFront:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Distribute articles to players
export const distributeToPlayers = async (game) => {
    try {
        if (!game.articles_to_visit || game.articles_to_visit.length === 0) {
            console.error("No articles to distribute");
            return;
        }

        console.log(`Distributing articles to ${game.players.length} players in game ${game._id}`);

        for (const player of game.players) {
            const randNumber = Math.floor(Math.random() * game.articles_to_visit.length);
            const randomArticle = game.articles_to_visit[randNumber];
            
            // Initialize arrays if they don't exist
            if (!player.articles_visited) {
                player.articles_visited = [];
            }

            // Set current article and add to visited
            player.current_article = randomArticle;
            if (!player.articles_visited.includes(randomArticle)) {
                player.articles_visited.push(randomArticle);
                player.found_target_articles.push(randomArticle);
            }
        }

        try {
            await game.save(); // Save the game once after all players are updated
            console.log(`Successfully distributed articles to players in game ${game._id}`);
        } catch (saveError) {
            // If there's a version conflict, log it but don't throw
            // The calling function will handle the retry logic
            if (saveError.name === 'VersionError') {
                console.log(`Version conflict in distributeToPlayers for game ${game._id}`);
            }
            throw saveError; // Rethrow to let the caller handle it
        }
    } catch (error) {
        console.error("Erreur dans distributeToPlayers :", error);
        throw error; // Propagate the error to the caller
    }
};

// Distribute a given number of random target articles to a game
export const distributeRandomArticles = async (req, res) => {
    try {
        const { id_game, number } = req.body;

        // Validate input
        if (!id_game || !number || isNaN(number) || number <= 0) {
            return res.status(400).json({ message: "Paramètres invalides." });
        }

        // Use the findGameByIdOrCode helper function instead of Game.findById
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        console.log(`Found game with ID ${game._id} and code ${game.game_code}`);

        if (!game.articles_to_visit) game.articles_to_visit = [];

        for (let x = 0; x < number; x++) {
            const newArticle = await generateRandomArticle();

            if (!newArticle || !newArticle.title) {
                console.error("Article invalide, on passe :", newArticle);
                continue;
            }

            try {
                const generatedArticle = await createArticle(newArticle.title);

                if (!generatedArticle || !generatedArticle._id) {
                    throw new Error("L'article n'a pas été correctement enregistré en base de données.");
                }

                if (!game.articles_to_visit.includes(generatedArticle._id)) {
                    game.articles_to_visit.push(generatedArticle._id);
                }
            } catch (err) {
                console.error("Erreur lors de la création de l'article :", err);
            }
        }

        try {
            await distributeToPlayers(game);
            await game.save();
        } catch (saveError) {
            // Handle version conflict errors
            if (saveError.name === 'VersionError') {
                console.log('Version conflict detected, retrying with fresh game document');

                // Fetch a fresh copy of the game
                const freshGame = await findGameByIdOrCode(id_game);
                if (!freshGame) {
                    return res.status(404).json({ message: "Jeu non trouvé lors de la tentative de résolution du conflit de version." });
                }

                // Copy the articles_to_visit to the fresh game
                if (!freshGame.articles_to_visit) freshGame.articles_to_visit = [];

                // Add any new articles that aren't already in the fresh game
                for (const articleId of game.articles_to_visit) {
                    if (!freshGame.articles_to_visit.some(id => id.toString() === articleId.toString())) {
                        freshGame.articles_to_visit.push(articleId);
                    }
                }

                // Try to distribute and save again
                await distributeToPlayers(freshGame);
                await freshGame.save();

                // Return the fresh game
                return res.status(200).json({ message: "Articles distribués avec succès (après résolution de conflit)", game: freshGame });
            } else {
                // For other errors, rethrow
                throw saveError;
            }
        }

        res.status(200).json({ message: "Articles distribués avec succès", game });
    } catch (error) {
        console.error("Erreur dans distributeRandomArticles :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};

const fetchNearestWikipediaArticle = async (latitude, longitude) => {
    const endpoint = `https://fr.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${latitude}|${longitude}&gsradius=10000&gslimit=1&format=json&origin=*`;

    const response = await fetch(endpoint);
    if (!response.ok) {
        throw new Error(`Erreur réseau : ${response.status}`);
    }
    const data = await response.json();

    if (data.query && data.query.geosearch && data.query.geosearch.length > 0) {
        const nearest = data.query.geosearch[0];
        return {
            title: nearest.title,
            pageid: nearest.pageid,
            lat: nearest.lat,
            lon: nearest.lon
        };
    } else {
        throw new Error("Aucun article trouvé à proximité.");
    }

};


export const distributeChallengeToPlayer = async (game, latitude, longitude) => {
    try {
        if (!game.articles_to_visit || game.articles_to_visit.length === 0) {
            console.error("No articles to distribute");
            return;
        }

        const player = game.players[0];

        if (!player.articles_visited) {
            player.articles_visited = [];
        }

        if (!player.found_target_articles) {
            player.found_target_articles = [];
        }

        const geographicArticle = await fetchNearestWikipediaArticle(latitude, longitude);
        const startArticle = (await createArticle(geographicArticle.title))._id;

        player.current_article = startArticle;

        if (!player.articles_visited.some(a => a === startArticle)) {
            player.articles_visited.push(startArticle);
        }

        await game.save();
        console.log(`Successfully distributed articles to players in game ${game._id}`);
    } catch (error) {
        console.error("Erreur dans distributeToPlayers :", error);
        throw error;
    }
};



export const distributeChallengesArticle = async (req, res) => {
    try {
        const { id_game, latitude, longitude } = req.body;

        const lat = parseFloat(latitude);
        const lon = parseFloat(longitude);

        if (isNaN(lat) || isNaN(lon)) {
            throw new Error("Coordonnées invalides.");
        }

        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        // Récupérer le challenge du jour
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const challenge = await Challenge.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!challenge) {
            return res.status(404).json({ message: "Challenge du jour introuvable." });
        }

        console.log(`Found game with ID ${game._id} and code ${game.game_code}`);

        if (!game.articles_to_visit) game.articles_to_visit = [];

        const newArticle = challenge.destination_article;

        try {
            const generatedArticle = await createArticle(newArticle);

            if (!generatedArticle || !generatedArticle._id) {
                throw new Error("L'article n'a pas été correctement enregistré en base de données.");
            }

            if (!game.articles_to_visit.includes(generatedArticle._id)) {
                game.articles_to_visit.push(generatedArticle._id);
            }
        } catch (err) {
            console.error("Erreur lors de la création de l'article :", err);
        }

        try {
            await distributeChallengeToPlayer(game, latitude, longitude);
            await game.save();
        } catch (saveError) {
            if (saveError.name === 'VersionError') {
                console.log('Version conflict detected, retrying with fresh game document');
                const freshGame = await findGameByIdOrCode(id_game);
                if (!freshGame) {
                    return res.status(404).json({ message: "Jeu non trouvé lors de la tentative de résolution du conflit de version." });
                }

                if (!freshGame.articles_to_visit) freshGame.articles_to_visit = [];

                for (const articleId of game.articles_to_visit) {
                    if (!freshGame.articles_to_visit.some(id => id.toString() === articleId.toString())) {
                        freshGame.articles_to_visit.push(articleId);
                    }
                }

                await distributeChallengeToPlayer(freshGame, latitude, longitude);
                await freshGame.save();

                return res.status(200).json({ message: "Articles distribués avec succès (après résolution de conflit)", game: freshGame });
            } else {
                throw saveError;
            }
        }

        res.status(200).json({ message: "Articles distribués avec succès", game });
    } catch (error) {
        console.error("Erreur dans distributeChallengesArticle :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};

// Récupérer tous les articles visités d'un joueur dans une partie
export const getVisitedArticlesPlayer = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        console.log(`Getting visited articles for player ${id_player} in game ${id_game}`);

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            console.log(`Game not found: ${id_game}`);
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            console.log(`Invalid player ID format: ${id_player}`);
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id && p.player_id.equals(playerObjectId));
        if (!player) {
            console.log(`Player ${id_player} not found in game ${id_game}`);
            return res.status(404).json({ error: "Player not found in this game" });
        }

        if (!player.articles_visited || !Array.isArray(player.articles_visited) || player.articles_visited.length === 0) {
            console.log(`No visited articles for player ${id_player}`);
            return res.status(200).json([]);
        }

        console.log(`Found ${player.articles_visited.length} visited articles for player ${id_player}`);

        // Get article titles from IDs
        const articleIds = player.articles_visited;
        const articles = await Promise.all(
            articleIds.map(async (id) => {
                try {
                    if (!id) return null;
                    const article = await Article.findById(id.toString());
                    return article ? article.title : null;
                } catch (err) {
                    console.error(`Error finding article with ID ${id}:`, err);
                    return null;
                }
            })
        );

        // Filter out null values
        const validArticles = articles.filter(article => article !== null);
        console.log(`Returning ${validArticles.length} valid visited articles`);

        return res.status(200).json(validArticles);
    } catch (error) {
        console.error("Error in getVisitedArticlesPlayer:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Récupérer les articles à trouver pour une partie
export const getTargetArticles = async (req, res) => {
    try {
        const { id_game } = req.body;

        if (!id_game) {
            return res.status(400).json({ error: "Game ID is required" });
        }

        console.log(`Getting target articles for game ${id_game}`);

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            console.log(`Game not found: ${id_game}`);
            return res.status(404).json({ error: "Game not found" });
        }

        if (!game.articles_to_visit || !Array.isArray(game.articles_to_visit) || game.articles_to_visit.length === 0) {
            console.log(`No target articles found for game ${id_game}`);
            return res.status(200).json([]);
        }

        console.log(`Found ${game.articles_to_visit.length} target articles for game ${id_game}`);

        // Get article titles from IDs
        const articleIds = game.articles_to_visit;
        const articles = await Promise.all(
            articleIds.map(async (id) => {
                try {
                    if (!id) return null;
                    const article = await Article.findById(id.toString());
                    return article ? article.title : null;
                } catch (err) {
                    console.error(`Error finding article with ID ${id}:`, err);
                    return null;
                }
            })
        );

        // Filter out null values
        const validArticles = articles.filter(article => article !== null);
        console.log(`Returning ${validArticles.length} valid target articles`);

        return res.status(200).json(validArticles);
    } catch (error) {
        console.error("Error in getTargetArticles:", error);
        return res.status(500).json({ error: "Server error", details: error.message });
    }
};

// Récupérer les artefacts d'un joueur
export const getArticfactPlayer = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        // Return the player's artifacts
        return res.status(200).json(player.artifacts || []);
    } catch (error) {
        console.error("Error in getArticfactPlayer:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

// Récupérer les artefacts storable d'un joueur
export const getStorableArticfactPlayer = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!mongoose.Types.ObjectId.isValid(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        const artifactNames = player.artifacts;

        const storableArtifacts = await Artifact.find({
            name: { $in: artifactNames },
            storable: true
        }).select("name");

        // Return the storable artifact names
        return res.status(200).json(storableArtifacts.map(artifact => artifact.name));

    } catch (error) {
        console.error("Error in getStorableArtifactPlayer:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const generateCode = () => {
    let code = '';
    for(let i = 0; i<4; i++){
        // Génère un nombre aléatoire entre 0 et 25
        const randomNum = Math.floor(Math.random() * 26);
        code += String.fromCharCode(65 + randomNum);
    }
    console.log(code);
    return code;
}

// Ajouter un jeu
export const createGame = async (req, res) => {
    try {
        const { id_creator } = req.body;

        // First try to find the player by the exact ID
        let player = await Player.findById(id_creator).catch(() => null);
        
        if (!player) {
            // If not found, try to find by the ID as a string field
            player = await Player.findOne({ _id: id_creator }).catch(() => null);
        }

        if (!player) {
            return res.status(404).json({ 
                message: "Player not found. Please log in again.",
                error: "INVALID_PLAYER"
            });
        }

        const game_code = generateCode();
        const status = "waiting";
        const start_time = Date.now();

        const players = [{
            player_id: player._id,
            articles_visited: [],
            current_article: null,
            artifacts: [],
            score: 0,
            is_host: true
        }];

        const newGame = new Game({
            game_code,
            status,
            start_time,
            players,
            settings: {
                max_players: null,
                time_limit: null,
                articles_number: 5,
                visibility: "private",
                allow_join: true
            }
        });

        player.current_game = newGame._id;
        await player.save();
        const savedGame = await newGame.save();

        res.status(201).json({
            game_id: savedGame._id,
            game_code: savedGame.game_code,
            message: "Game created successfully"
        });
    } catch (error) {
        console.error("Create game error:", error);
        res.status(400).json({ 
            message: "Error creating game. Please try again.",
            error: error.message
        });
    }
};

export const createGameWithChallenge = async (req, res) => {
    try {
        const { id_creator } = req.body;

        // Récupère la date du jour sans l'heure (pour une correspondance exacte avec celle stockée dans MongoDB)
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // Recherche du challenge du jour
        const challenge = await Challenge.findOne({
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!challenge) {
            return res.status(404).json({
                message: "Challenge for today not found.",
                error: "CHALLENGE_NOT_FOUND"
            });
        }

        const challenge_id = challenge._id;

        // Récupération du joueur
        let player = await Player.findById(id_creator).catch(() => null);

        if (!player) {
            player = await Player.findOne({ _id: id_creator }).catch(() => null);
        }

        if (!player) {
            return res.status(404).json({
                message: "Player not found. Please log in again.",
                error: "INVALID_PLAYER"
            });
        }

        const game_code = generateCode();
        const status = "in_progress";
        const start_time = Date.now();

        const players = [{
            player_id: player._id,
            articles_visited: [],
            current_article: null,
            artifacts: [],
            score: 0,
            is_host: true
        }];

        const newGame = new Game({
            game_code,
            status,
            start_time,
            players,
            challenge_id,
            settings: {
                max_players: null,
                time_limit: null,
                articles_number: 1,
                visibility: "private",
                allow_join: true
            }
        });

        player.current_game = newGame._id;
        await player.save();
        const savedGame = await newGame.save();

        res.status(201).json({
            game_id: savedGame._id,
            game_code: savedGame.game_code,
            message: "Game created successfully"
        });
    } catch (error) {
        console.error("Create challenge game error:", error);
        res.status(400).json({
            message: "Error creating challenge game. Please try again.",
            error: error.message
        });
    }
};


export const gameAndPlayers = async (id_game, id_player) => {
    try {
        const gameObjectId = new mongoose.Types.ObjectId(id_game);
        const game = await Game.findById(gameObjectId);
        if (!game) {
            throw new Error("Jeu non trouvé.");
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            console.log("gameAndPlayers - gameId:", id_game, "playerId:", id_player);
            console.log("gameAndPlayers - game data:", game);
            console.log("gameAndPlayers - players list:", game?.players);
            throw new Error("Joueur non trouvé dans ce jeu.");
        }

        return [game, player];
    } catch (error) {
        console.error("Erreur dans gameAndPlayers :", error);
        throw error;
    }
};

// Helper function to find a game by ID or code
const findGameByIdOrCode = async (gameIdentifier) => {
    // Check if gameIdentifier is a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(gameIdentifier)) {
        return await Game.findById(gameIdentifier);
    } else {
        // If not a valid ObjectId, try to find by game code
        return await Game.findOne({ game_code: gameIdentifier });
    }
};

export const backArtifact = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Trouver le jeu par ID ou code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validation du format de l'ID joueur
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        // Vérifier qu'il y a au moins deux articles visités pour pouvoir revenir en arrière
        if (player.articles_visited.length < 2) {
            return res.status(400).json({ message: "Pas assez d'articles visités pour revenir en arrière." });
        }

        // Récupérer l'article précédent
        const previousArticle = player.articles_visited[player.articles_visited.length - 2];

        player.current_article = previousArticle;

        player.articles_visited.pop();

        await game.save();

        // Retourner l'article précédent au frontend
        res.status(200).json({ message: "Retour à l'article précédent réussi.", previousArticle });
    } catch (error) {
        console.error("Error in backArtifact:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

async function getAllLinks(title) {
    const baseUrl = "https://fr.wikipedia.org/w/api.php";
    let params = {
        action: "query",
        list: "backlinks",
        bltitle: title,
        bllimit: "max",
        format: "json",
        blnamespace: 0,
    };
    let allLinks = [];

    while (true) {
        const url = baseUrl + "?" + new URLSearchParams(params).toString();
        console.log(`Requête Wikipedia : ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.query && data.query.backlinks) {
            allLinks.push(...data.query.backlinks.map(link => link.title));
        }

        if (data.continue && data.continue.blcontinue) {
            params.blcontinue = data.continue.blcontinue;
        } else {
            break;
        }
    }

    return allLinks;
}

export const teleporterArtifact = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        const rand = Math.floor(Math.random() * game.articles_to_visit.length);
        console.log(`Article aléatoire choisi: index ${rand}`);

        const article = await Article.findById(game.articles_to_visit[rand].toString());

        if (!article) {
            return res.status(404).json({ message: "Article à visiter non trouvé." });
        }
        console.log(`Article trouvé : ${article.title}`);

        const firstAllLinks = await getAllLinks(article.title);
        if (firstAllLinks.length === 0) {
            return res.status(404).json({ message: "Aucun lien interne trouvé dans cet article." });
        }

        const firstArticleRand = Math.floor(Math.random() * firstAllLinks.length);
        const firstArticle = firstAllLinks[firstArticleRand];

        console.log(`Premier article intermédiaire : ${firstArticle}`);

        const secondAllLinks = await getAllLinks(firstArticle);
        if (secondAllLinks.length === 0) {
            return res.status(404).json({ message: "Aucun lien interne trouvé dans le deuxième article." });
        }

        const secondArticleRand = Math.floor(Math.random() * secondAllLinks.length);
        const secondArticle = secondAllLinks[secondArticleRand];

        console.log(`Article destination choisi : ${secondArticle}`);

        const newArticle = await createArticle(secondArticle);
        await changeArticle(id_game, id_player, newArticle);

        await game.save();

        res.status(200).json({ message: "Téléportation réussie.", newArticle });
    } catch (error) {
        console.error("Error in teleporterArtifact:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const mineArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;
    console.log("mineArtifact request body:", req.body); // Log des données reçues

    try {
        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        console.log("Game found:", game); // Log du jeu trouvé

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        console.log("Player ObjectId:", playerObjectId); // Log de l'ObjectId du joueur

        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        console.log("Player found:", player); // Log du joueur trouvé

        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        console.log("Player articles visited:", player.articles_visited.length); // Log des articles visités

        if (player.articles_visited.length < 5) {
            return res.status(400).json({ message: "Ce joueur n'a pas assez d'articles visités pour appliquer la mine dessus." });
        }

        const previousArticle = player.articles_visited[player.articles_visited.length - 6];
        console.log("Previous article:", previousArticle); // Log de l'article précédent

        await changeArticle(id_game, id_player, previousArticle);
        console.log("Article changed successfully"); // Log de la réussite du changement d'article

        await game.save();
        console.log("Game saved successfully"); // Log de la réussite de l'enregistrement du jeu

        res.status(200).json({ message: "Retour à 5 articles précédent réussi.", previousArticle });
    } catch (error) {
        console.error("Error in mineArtifact:", error); // Log de l'erreur
        return res.status(500).json({ error: "Server error" });
    }
};
//Artefact qui swap les joueurs d'articles
export const eraserArtifact = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        if(player.articles_visited.length < 2) {
            return res.status(404).json({ error: "Need atleast 2 articles visited" });
        }

        let latestArticle = undefined;
        // Find the latest article visited by the player that is still in the game's articles_to_visit
        for (let i = player.articles_visited.length - 1; i >= 0; i--) {
            if (game.articles_to_visit.map(a => a.toString()).includes(player.articles_visited[i].toString())) {
                latestArticle = player.articles_visited[i];
                break;
            }
        }

        // If no latest article is found, return an error
        if (!latestArticle) {
            return res.status(400).json({ message: "Le joueur n'a visité aucun article cible." });
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            player.articles_visited = player.articles_visited.filter(article => article.toString() !== latestArticle.toString());
            player.found_target_articles = player.found_target_articles.filter(article => article.toString() !== latestArticle.toString());
            await game.save({ session });
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }

        res.status(200).json({ message: "Article trouvé le plus récent supprimé.", articlesToDelete: [latestArticle] });

    } catch (error) {
        console.error("Error in eraserArtifact:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const disorienterArtifact = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

        if (!id_game || !id_player) {
            return res.status(400).json({ error: "Game ID and Player ID are required" });
        }

        // Find game by ID or code
        const game = await findGameByIdOrCode(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Validate player ID format
        if (!/^[0-9a-fA-F]{24}$/.test(id_player)) {
            return res.status(400).json({ error: "Invalid Player ID format" });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        const randPage = await generateRandomArticle();

        const generatedArticle = await createArticle(randPage.title);

        if (!generatedArticle || !generatedArticle._id) {
            throw new Error("L'article n'a pas été correctement enregistré en base de données.");
        }

        await changeArticle(id_game, id_player, generatedArticle._id);

        res.status(200).json({ message: "Joueur envoyé sur une page random.", randomArticle: [generatedArticle] });

    } catch (error) {
        console.error("Error in disorienterArtifact:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

export const dictatorArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);

        const notFoundArticle = game.articles_to_visit.filter(article => !player.found_target_articles.includes(article));

        if (notFoundArticle.length === 0) {
            return res.status(404).json({ message: "Tous les articles ont déjà été trouvés." });
        }

        const randNumber = Math.floor(Math.random() * notFoundArticle.length);
        const dictateArticle = await Article.findById(notFoundArticle[randNumber]); // Ajout de await

        if (!dictateArticle) {
            return res.status(404).json({ message: "Article non trouvé." });
        }
        player.dictateArticle = dictateArticle.title;
        await game.save();
        res.status(200).json({ message: "Article à trouver.", dictateArticle: dictateArticle.title });

    } catch (error) {
        console.error("Erreur dans dictatorArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};



export const getPublicGames = async (req, res) => {
    try {
        const publicGames = await Game.find({ "settings.visibility": "public", status: "waiting" });


        const infoGames = await Promise.all(publicGames.map(async (game) => {
            const player = await Player.findById(game.players[0].player_id);
            const playerName = player ? player.pseudo : "Joueur inconnu";
            return [game.game_code, playerName, game.players.length, game.settings.max_players];
        }));

        res.json(infoGames);
    } catch (e) {
        console.error("Erreur getPublicGames :", e);
        res.status(500).json({ message: "Erreur lors de la récupération des parties publiques." });
    }
};

async function setArtifactDistribution(id_game, article_title) {
    try {
        if (!id_game) {
            throw new Error("ID du jeu requis");
        }

        if (!article_title) {
            throw new Error("Titre d'article requis");
        }

        // Trouver l'article
        const article = await Article.findOne({ title: article_title });
        if (!article) {
            throw new Error("Article non trouvé");
        }

        const game = await Game.findById(id_game);
        if (!game) {
            throw new Error("Jeu non trouvé");
        }

        // Récupérer les artefacts autorisés depuis les paramètres du jeu
        const enabledArtifacts = game.settings.enabled_artifacts || [];

        if (enabledArtifacts.length === 0) {
            throw new Error("Aucun artefact autorisé dans les paramètres du jeu");
        }

        // Filtrer uniquement les artefacts autorisés
        let positiveArtifacts = await Artifact.find({ positive: true, name: { $in: enabledArtifacts } });
        let negativeArtifacts = await Artifact.find({ positive: false, name: { $in: enabledArtifacts } });

        if (positiveArtifacts.length === 0 && negativeArtifacts.length === 0) {
            throw new Error("Aucun artefact valide trouvé parmi ceux autorisés");
        }

        console.log('Filtered positive artifacts:', positiveArtifacts.map(a => a.name));
        console.log('Filtered negative artifacts:', negativeArtifacts.map(a => a.name));

        const randomPositive = Math.floor(Math.random() * positiveArtifacts.length);
        const randomNegative = Math.floor(Math.random() * negativeArtifacts.length);

        let randomArtifact;
        if (article.popular === true && negativeArtifacts.length > 0) {
            randomArtifact = negativeArtifacts[randomNegative];
        } else if (positiveArtifacts.length > 0) {
            randomArtifact = positiveArtifacts[randomPositive];
        } else {
            throw new Error("Aucun artefact disponible après filtrage");
        }

        // Sauvegarder les modifications
        await game.save();

        return randomArtifact.name; // Retourne le nom de l'artefact
    } catch (error) {
        console.error("Erreur lors de la distribution d'un artefact:", error);
        throw error; // Relance l'erreur pour une gestion externe
    }
}



export const distributeArtifacts = async (req, res) => {
    const { id_game, enabledArtifacts = [] } = req.body;

    if (!id_game) {
        return res.status(400).json({ error: "Game ID is required" });
    }

    try {
        // Trouver le jeu
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        console.log('Game settings in distributeArtifacts:', game.settings);
        console.log('Enabled artifacts from request:', enabledArtifacts);

        // Get enabled artifacts from settings if not provided in the request
        let artifactsToUse = enabledArtifacts;
        if (artifactsToUse.length === 0 && game.settings && game.settings.enabled_artifacts) {
            artifactsToUse = game.settings.enabled_artifacts;
            console.log(`Using ${artifactsToUse.length} enabled artifacts from game settings:`, artifactsToUse);
        } else {
            console.log('No enabled artifacts found in settings, using default or request artifacts');
        }

        // Distribuer des artefacts aux joueurs
        for (const player of game.players) {
            const currentArticle = await Article.findById(player.current_article);
            if (!currentArticle) {
                console.warn(`Article not found for player ${player.player_id}`);
                continue; // Ignore ce joueur si l'article est introuvable
            }

            try {
                const artifact = await setArtifactDistribution(id_game, currentArticle.title, artifactsToUse);
                player.artifacts.push(artifact);
            } catch (error) {
                console.warn(`Error assigning artifact to player ${player.player_id}:`, error.message);
            }
        }

        // Sauvegarder le jeu avec les artefacts mis à jour
        await Game.findByIdAndUpdate(id_game, { $set: { players: game.players } }, { new: true });

        console.log(`Artifacts distributed to ${game.players.length} players in game ${id_game}`);
        return res.status(200).json({
            message: "Artifacts distributed successfully",
            players: game.players.map(p => ({
                player_id: p.player_id,
                artifacts: p.artifacts
            }))
        });
    } catch (error) {
        console.error("Error distributing artifacts:", error);
        return res.status(500).json({ error: "Failed to distribute artifacts", details: error.message });
    }
};

export const setMineArtifacts = async (req, res) => {
    const { id_game, title } = req.body;

    try {
        const game = await Game.findById(id_game);

        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if (!game.mined_article) {
            game.mined_article = [];
        }


        const formattedTitle = title.replace(/_/g, " ").replace(/ /g, "_");

        const articles = await Article.find({ title: formattedTitle });
        if (articles.length === 0) {
            return res.status(404).json({ error: "Article not found" });
        }

        const id_article = articles[0]._id;

        if (game.articles_to_visit && game.articles_to_visit.includes(id_article.toString())) {
            return res.status(200).json({ isArticleToFind: true });
        }

        game.mined_article.push(formattedTitle);

        await game.save();

        return res.status(200).json({ message: "Artifact added successfully", game, isArticleToFind: false });
    } catch (error) {
        console.error("Error setMineArtifacts:", error);
        return res.status(500).json({ error: "Failed to setMineArtifacts", details: error.message });
    }
};

export const fetchLeaderBoard = async (req, res) => {
    const { id_game } = req.body;

    try {
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const articlesToFindLength = game.articles_to_visit.length;

        // Sort players based on found_target_articles length
        const sortedPlayers = [...game.players].sort((a, b) =>
            b.found_target_articles.length - a.found_target_articles.length
        );


        // Fetch player details asynchronously
        const informationPlayers = await Promise.all(sortedPlayers.map(async playerInformation => {
            const score = `${playerInformation.found_target_articles.length}/${articlesToFindLength}`;
            const player = await Player.findById(playerInformation.player_id);
            const visitedIds = playerInformation.articles_visited || [];
            const articles = await Article.find({ _id: { $in: visitedIds } });
            const visited = articles.map(article => article.title);
            if (!player) {
                return { pp: null, pseudo: "Unknown", score };
            }

            return { pp: player.pp, pseudo: player.pseudo, score, visited: visited.filter(title => title !== null) };
        }));

        if (game.status !== "finish") {
            await Game.findByIdAndUpdate(id_game, { $set: { status: "finish" } }, { new: true });
        }


        return res.status(200).json({ message: "Sorted players successfully", players: informationPlayers });

    } catch (e) {
        console.error("Error fetchLeaderBoard:", e);
        return res.status(500).json({ error: "Failed to fetch leaderboard", details: e.message });
    }
};

export const deleteUsedArtifact = async (req, res) => {
    const { id_game, id_player, artifact } = req.body;

    console.log("deleteUsedArtifact request body:", req.body); // Ajout pour le débogage

    try {
        if (!id_game || !id_player || !artifact) {
            return res.status(400).json({ error: "Game ID, Player ID and Artifact are required" });
        }

        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        // Trouver le joueur directement dans le jeu
        const player = game.players.find(p => p.player_id.toString() === id_player);
        if (!player) {
            return res.status(404).json({ error: "Player not found in this game" });
        }

        // Supprimer l'artefact
        const index = player.artifacts.indexOf(artifact);
        if (index !== -1) {
            player.artifacts.splice(index, 1);
        } else {
            return res.status(404).json({ error: "Artifact not found" });
        }

        await game.save();

        return res.status(200).json({ message: "Artifact deleted successfully" });
    } catch (e) {
        console.error("Error deleteUsedArtifact:", e);
        return res.status(500).json({ error: "Failed to delete artifact", details: e.message });
    }
};


export const isArticleToFind = async (req, res) => {
    const { id_game, article } = req.body;

    try {
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        const articles = await Article.find({ title: article });
        if (articles.length === 0) {
            return res.status(404).json({ error: "Article not found" });
        }

        const id_article = articles[0]._id;

        if (game.articles_to_visit && game.articles_to_visit.includes(id_article.toString())) {
            return res.status(200).json({ isArticleToFind: true });
        }

        return res.status(200).json({ isArticleToFind: false });

    } catch (e) {
        console.error("Error in isArticleToFind:", e);
        return res.status(500).json({ error: "Failed to check article", details: e.message });
    }
};


export const getMaxTime = async (req, res) => {
    const {id_game} = req.body;

    try{
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }

        if(game.settings.time_limit === null){
            return res.status(200).json({ isInfinite: true });
        }
        return res.status(200).json({ isInfinite: false, time:  game.settings.time_limit});
    } catch (e) {
        console.error("Error in getMaxTime:", e);
        return res.status(500).json({ error: "Failed to check max time", details: e.message });
    }
}

