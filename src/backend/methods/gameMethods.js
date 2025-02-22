import Game from "../models/Game.js";
import mongoose from "mongoose";
import {createArticle} from "./articleMethods.js";
import Player from "../models/Player.js";
import Article from "../models/Article.js";
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


// Récupérer tous les joueurs d'une partie spécifique
export const getGamePlayers = async (req, res) => {
    try {
        const { id_game } = req.body;
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


export const generateRandomArticle = async () => {
    try {
        const url = 'https://fr.wikipedia.org/api/rest_v1/page/random/summary';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération de l'article aléatoire : ${response.statusText}`);
        }
        const data = await response.json();
        const formattedTitle = encodeURIComponent(data.title.replace(/ /g, '_'));

        // Calculer la période pour le mois dernier
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayOfLastMonth = lastMonth.toISOString().slice(0, 10).replace(/-/g, '');
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10).replace(/-/g, '');

        const pageviewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia.org/all-access/user/${formattedTitle}/daily/${firstDayOfLastMonth}/${lastDayOfLastMonth}`;

        const response2 = await fetch(pageviewsUrl);
        if (!response2.ok) {
            console.warn(`Aucune donnée de vues pour l'article "${data.title}". Erreur: ${response2.status} - ${response2.statusText}`);
            return { title: data.title, pageviewsData: null, totalViews: 0 };
        }


        const pageviewsData = await response2.json();
        if (!pageviewsData.items || pageviewsData.items.length === 0) {
            console.warn(`Pas de données de vues disponibles pour "${data.title}".`);
            return { title: data.title, pageviewsData: null, totalViews: 0 };
        }

        const totalViews = pageviewsData.items.reduce((sum, item) => sum + item.views, 0);


        return { title: data.title, totalViews };
    } catch (error) {
        console.error("Erreur dans generateRandomArticle :", error);
        throw error;
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
                const generatedArticle = await createArticle(newArticle.title, newArticle.totalViews);

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


// Récupérer les articles cibles trouvés par un joueur
export const getFoundTargetArticles = async (req, res) => {
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
        const findTarget = player.articles_visited.filter(article =>
            game.articles_to_visit.includes(article)
        );

        res.status(200).json(findTarget);
    } catch (error) {
        console.error("Erreur lors de la récupération des articles cibles:", error);
        res.status(500).json({ message: "Erreur interne du serveur." });
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
        const { id_creator } = req.body; // Assuming id_creator is passed in the request body

        const game_code = generateCode(); // Renamed secretCode to game_code
        const status = "waiting";
        const start_time = Date.now();

        const player = await Player.findById(id_creator); // Added await
        if (!player) {
            return res.status(404).json({ message: "Player not found" });
        }

        const players = [{
            player_id: player._id,
            articles_visited: [],
            current_article: null,
            artifacts: [],
            score: 0
        }];

        const newGame = new Game({ game_code, status, start_time, players });
        player.current_game = newGame._id;
        await player.save();
        const savedGame = await newGame.save();
        res.status(201).json(savedGame);
    } catch (error) {
        console.error(error); // Log the error for debugging
        res.status(400).json({ message: "Erreur lors de l'ajout du jeu" });
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

        if (!(player.artifacts.includes("Backtrack"))) {
            return res.status(400).json({ message: "Aucun artefact disponible pour revenir en arrière." });
        }
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
        titles: title,
        prop: "links",
        format: "json",
        pllimit: "max",
        origin: "*"
    };
    let allLinks = [];

    while (true) {
        const url = baseUrl + "?" + new URLSearchParams(params).toString();

        const response = await fetch(url);
        const data = await response.json();

        const page = Object.values(data.query.pages)[0];
        if (page.links) {
            allLinks.push(...page.links.map(link => link.title));
        }

        if (data.continue) {
            params.plcontinue = data.continue.plcontinue;
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

        if (!player.artifacts.includes("Teleporter")) {
            return res.status(400).json({ message: "Aucun artefact disponible pour se téléporter." });
        }

        const article = await Article.findById(player.current_article);
        if (!article) {
            return res.status(404).json({ message: "Article actuel non trouvé." });
        }

        const firstTeleport = (await getAllLinks(article.title)).filter(link => !link.includes("Module:"));
        const randNumber = Math.floor(Math.random() * firstTeleport.length);
        const firstArticle = firstTeleport[randNumber];
        console.log(firstArticle);
        const secondTeleporter = await getAllLinks(firstArticle);
        const randSecondNumber = Math.floor(Math.random() * secondTeleporter.length);
        const secondArticle = secondTeleporter[randSecondNumber];
        console.log(secondArticle);
        const formattedTitle = encodeURIComponent(secondArticle.replace(/ /g, '_'));

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayOfLastMonth = lastMonth.toISOString().slice(0, 10).replace(/-/g, '');
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10).replace(/-/g, '');

        const pageviewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia.org/all-access/user/${formattedTitle}/daily/${firstDayOfLastMonth}/${lastDayOfLastMonth}`;
        const response2 = await fetch(pageviewsUrl);

        let totalViews = 0;
        if (response2.ok) {
            const pageviewsData = await response2.json();
            if (pageviewsData.items && pageviewsData.items.length > 0) {
                totalViews = pageviewsData.items.reduce((sum, item) => sum + item.views, 0);
            } else {
                console.warn(`Pas de données de vues disponibles pour "${secondArticle}".`);
            }
        } else {
            console.warn(`Aucune donnée de vues pour l'article "${secondArticle}". Erreur: ${response2.status} - ${response2.statusText}`);
        }

        const newArticle = await createArticle(secondArticle, totalViews);
        await changeArticle(id_game, id_player, newArticle);
        await game.save();

        // Répondre avec succès
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

        if (!(player.artifacts.includes("Mine"))) {
            return res.status(400).json({ message: "Aucun artefact disponible pour revenir en arrière." });
        }
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

        // Check if the player has the "Eraser" artifact
        if (!player.artifacts.includes("Eraser")) {
            return res.status(400).json({ message: "Aucun artefact disponible pour gommer l'article du joueur." });
        }

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

        // Check if the player has the "Disorienter" artifact
        if (!player.artifacts.includes("Disorienter")) {
            return res.status(400).json({ message: "Aucun artefact disponible pour désorienter le joueur." });
        }

        const randPage = await generateRandomArticle();

        const generatedArticle = await createArticle(randPage.title, randPage.totalViews);

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

        // Check if the player has the "Dictator" artifact
        if (!player.artifacts.includes("Dictator")) {
            return res.status(400).json({ message: "Aucun artefact disponible pour dicter le joueur." });
        }

        const notFoundArticle = game.articles_to_visit.filter(article => !player.articles_visited.includes(article));
        const randNumber = Math.floor(Math.random() * notFoundArticle.length);

        const dictateArticle = notFoundArticle[randNumber];

        res.status(200).json({ message: "Article à trouver.", dictateArticle: [dictateArticle] });

    } catch (error) {
        console.error("Erreur dans dictatorArtifact :", error);
        res.status(500).json({ message: "Erreur serveur", details: error.message });
    }
};


