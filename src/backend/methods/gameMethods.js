import Game from "../models/Game.js";
import mongoose from "mongoose";
import "./articleMethods.js";
import Player from "../models/Player.js";
import Article from "../models/Article.js";
import {createArticle, generateRandomArticle} from "./articleMethods.js";

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

// Récupérer les articles cibles trouvés par un joueur
export const getFoundTargetArticles = async (id_game, id_player) => {
    if (!id_game || !id_player) {
        return { error: "Les IDs du jeu et du joueur sont requis." };
    }

    try {
        const game = await Game.findById(id_game);
        if (!game) {
            console.error("Jeu non trouvé");
            return { error: "Jeu non trouvé." };
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));

        if (!player) {
            console.error(`Joueur ${id_player} non trouvé dans ce jeu.`);
            return { error: "Joueur non trouvé dans ce jeu." };
        }

        if (!player.articles_visited || !Array.isArray(player.articles_visited)) {
            return [];
        }

        return player.articles_visited.filter(article =>
            game.articles_to_visit.includes(article)
        );
    } catch (error) {
        console.error("Erreur lors de la récupération des articles cibles:", error);
        return { error: "Erreur serveur." };
    }
};

export const getCurrentArticle = async (req, res) => {
    const {id_game, id_player} = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);

        const current = await Article.findById(player.current_article.toString());
        if (!current) {
            res.status(404).json({message: "Aucun article courant"});
        }

        res.status(200).json(current.title);
    } catch (e){
        console.error('Erreur dans getCurrentArticle',e);
    }
}

// Récupérer tous les joueurs d'une partie spécifique
export const getGamePlayers = async (req, res) => {
    try {
        const { id_game } = req.body;
        if (!id_game) {
            return res.status(400).json({ message: "L'ID du jeu est requis." });
        }

        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        const playerIds = game.players.map(player => player.player_id);
        if (playerIds.length === 0) {
            return res.status(404).json({ message: "Aucun joueur trouvé pour ce jeu." });
        }

        const players = await Promise.all(
            playerIds.map(async (playerId) => {
                const player = await Player.findById(playerId);
                if (!player) return null;

                const foundArticles = await getFoundTargetArticles(id_game, playerId);

                // Vérification en cas d'erreur dans la récupération des articles
                if (foundArticles.error) return null;

                return {
                    id: playerId,
                    pseudo: player.pseudo,
                    pp: player.pp,
                    score: foundArticles.length
                };
            })
        );

        // Filtrer les joueurs valides
        const filteredPlayers = players.filter(player => player !== null);

        return res.status(200).json(filteredPlayers);
    } catch (error) {
        console.error("Erreur dans getGamePlayers :", error);
        return res.status(500).json({ message: "Erreur serveur" });
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

    await game.save();

    return { message: "Article changé avec succès.", id_article: articleId };
};

export const changeArticleFront = async (req, res) => {
    try {
        const { gameId, playerId, articleId } = req.body;

        if (!gameId || !playerId || !articleId) {
            return res.status(400).json({ error: "Tous les identifiants sont requis." });
        }

        if (!await gameExists(gameId)) {
            return res.status(404).json({ error: "Jeu non trouvé." });
        }

        if (!await playerExistsInGame(gameId, playerId)) {
            return res.status(404).json({ error: "Joueur non trouvé dans ce jeu." });
        }

        if (!await playerHasCurrentArticle(gameId, playerId)) {
            return res.status(400).json({ error: "Aucun article actuel trouvé." });
        }

        // Mise à jour directe avec `$push` et `$set`
        const result = await Game.updateOne(
            { _id: gameId, "players.player_id": playerId },
            {
                $set: { "players.$.current_article": articleId },
                $addToSet: { "players.$.articles_visited": articleId }
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: "Impossible de mettre à jour l'article du joueur." });
        }

        return res.status(200).json({ message: "Article changé avec succès.", id_article: articleId });

    } catch (error) {
        console.error("Erreur lors du changement d'article :", error);
        return res.status(500).json({ error: "Une erreur interne est survenue." });
    }
};




// Distribute articles to players
export const distributeToPlayers = async (game) => {
    try {
        game.players.forEach(player => {
            const randNumber = Math.floor(Math.random() * game.articles_to_visit.length);
            if (!player.current_article) {player.current_article = game.articles_to_visit[randNumber]}
            else {player.current_article = game.articles_to_visit[randNumber]};

            // Append the current article to the list of visited articles
            if (!player.articles_visited) {
                player.articles_visited = [];
            }
            player.articles_visited.push(player.current_article);
        });

        await game.save(); // Save the game once after all players are updated
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

        // Check if the game exists
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        if (!game.articles_to_visit) game.articles_to_visit = [];
        if (!game.artifacts_distribution) game.artifacts_distribution = [];

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
                    game.artifacts_distribution.push({ article: new ObjectId(generatedArticle._id), artifact: "GPS" });
                }
            } catch (err) {
                console.error("Erreur lors de la création de l'article :", err);
            }
        }
        await distributeToPlayers(game);
        await game.save();

        res.status(200).json({ message: "Articles distribués avec succès", game });
    } catch (error) {
        console.error("Erreur dans distributeRandomArticles :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};



// Récupérer tous les articles visités d'un joueur dans une partie
export const getVisitedArticlesPlayer = async (req, res) => {
    try {
        const { id_game, id_player } = req.body;

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
        const targets = await Promise.all(
            visitedArticles.map(async (articleId) => {
                const article = await Article.findById(articleId);
                return article ? article.title : null; // Retourne le titre de l'article ou null si non trouvé
            })
        );
        res.status(200).json(targets);
    } catch (error) {
        console.error("Erreur dans getVisitedArticlesPlayer :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
};




// Récupérer les articles cibles
export const getTargetArticles = async (req, res) => {
    const { id_game } = req.body;

    if (!id_game) {
        return res.status(400).json({ message: "L'ID du jeu est requis." });
    }

    try {
        // Trouver le jeu par son ID
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        // Récupérer les titres des articles à visiter
        const targets = await Promise.all(
            game.articles_to_visit.map(async (articleId) => {
                const article = await Article.findById(articleId);
                return article ? article.title : null; // Retourne le titre de l'article ou null si non trouvé
            })
        );

        // Filtrer les articles valides (supprimer les null)
        const validTargets = targets.filter(title => title !== null);

        // Renvoyer les titres des articles
        res.status(200).json(validTargets);
    } catch (error) {
        console.error("Erreur lors de la récupération des articles cibles:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
    }
};

// Récupérer les artefacts d'un joueur
export const getArticfactPlayer = async (req, res) => {
    const { id_game, id_player } = req.body;

    if (!id_game || !id_player) {
        return res.status(400).json({ message: "Les IDs du jeu et du joueur sont requis." });
    }

    try {
        const game = await Game.findById(id_game);
        if (!game) {
            return res.status(404).json({ message: "Jeu non trouvé." });
        }

        const playerObjectId = new mongoose.Types.ObjectId(id_player);
        const player = game.players.find(p => p.player_id.equals(playerObjectId));
        if (!player) {
            return res.status(404).json({ message: "Joueur non trouvé dans ce jeu." });
        }
        const artifacts = player.artifacts

        res.status(200).json(artifacts);
    } catch (error) {
        console.error("Erreur lors de la récupération des artefact du joueur:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
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
                visibility: "public",
                allow_join: true
            }
        });

        player.current_game = newGame._id;
        await player.save();
        const savedGame = await newGame.save();

        res.status(201).json({
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
            throw new Error("Joueur non trouvé dans ce jeu.");
        }

        return [game, player];
    } catch (error) {
        console.error("Erreur dans gameAndPlayers :", error);
        throw error;
    }
};
export const backArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);

        if (player.articles_visited.length < 2) {
            return res.status(400).json({ message: "Pas assez d'articles visités pour revenir en arrière." });
        }

        const previousArticle = player.articles_visited[player.articles_visited.length - 2];
        await changeArticle(game._id, player.player_id, previousArticle);

        await game.save();

        res.status(200).json({ message: "Retour à l'article précédent réussi.", previousArticle });
    } catch (error) {
        console.error("Erreur dans backArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
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
        origin: "*"
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
    const { id_game, id_player } = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);

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
        console.error("Erreur dans teleporterArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};


export const mineArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try{
        const [game, player] = await gameAndPlayers(id_game, id_player);

        if (player.articles_visited.length < 5) {
            return res.status(400).json({ message: "Ce joueur n'a pas assez d'articles visités pour appliquer la mine dessus." });
        }

        const previousArticle = player.articles_visited[player.articles_visited.length - 6];
        await changeArticle(game._id, player.player_id, previousArticle);

        await game.save();

        res.status(200).json({ message: "Retour à 5 articles précédent réussi.", previousArticle });


    } catch(error){
        console.error("Erreur dans mineArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
}

//Artefact qui swap les joueurs d'articles

export const eraserArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        let latestArticle = undefined;
        const [game, player] = await gameAndPlayers(id_game, id_player);

        // Find the latest article visited by the player that is still in the game's articles_to_visit
        for (let i = player.articles_visited.length - 1; i >= 0; i--) {
            if (game.articles_to_visit.includes(player.articles_visited[i])) {
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
            player.articles_visited = player.articles_visited.filter(article => article !== latestArticle);
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
        console.error("Erreur dans eraserArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};

export const disorienterArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);


        const randPage = await generateRandomArticle();

        const generatedArticle = await createArticle(randPage.title);

        if (!generatedArticle || !generatedArticle._id) {
            throw new Error("L'article n'a pas été correctement enregistré en base de données.");
        }

        await changeArticle(id_game, id_player, generatedArticle._id);

        res.status(200).json({ message: "Joueur envoyé sur une page random.", randomArticle: [generatedArticle] });

    } catch (error) {
        console.error("Erreur dans disorienterArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};

export const dictatorArtifact = async (req, res) => {
    const { id_game, id_player } = req.body;

    try {
        const [game, player] = await gameAndPlayers(id_game, id_player);

        const notFoundArticle = game.articles_to_visit.filter(article => !player.articles_visited.includes(article));
        const randNumber = Math.floor(Math.random() * notFoundArticle.length);

        const dictateArticle = notFoundArticle[randNumber];

        res.status(200).json({ message: "Article à trouver.", dictateArticle: [dictateArticle] });

    } catch (error) {
        console.error("Erreur dans dictatorArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};


