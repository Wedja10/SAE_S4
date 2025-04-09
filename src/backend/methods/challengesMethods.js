import Challenge from "../models/Challenge.js";
import Player from '../models/Player.js';
import mongoose from 'mongoose';
import {createArticle, generateRandomArticle} from "./articleMethods.js";

export const destinationArticleChallenge = async (req, res) => {
    try {
        const newArticle = await generateRandomArticle();

        if (!newArticle || !newArticle.title) {
            console.error("Article invalide, on passe :", newArticle);
        }

        try {
            const generatedArticle = await createArticle(newArticle.title);

            if (!generatedArticle || !generatedArticle._id) {
                throw new Error("L'article n'a pas été correctement enregistré en base de données.");
            }

            res.status(200).json({title : generatedArticle.title});
        } catch (err) {
            console.error("Erreur lors de la création de l'article :", err);
        }
    } catch (error) {
        console.error("Erreur lors de destinationArticleChallenge :", error);
    }
}



export const getPastChallengesWithPlayers = async (req, res) => {
    try {
        // 1. Date du jour à minuit
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Récupérer les challenges valides d'avant aujourd'hui
        const challenges = await Challenge.find({
            date: { $exists: true, $lt: today }
        }).lean();

        // 3. Extraire tous les IDs de joueurs impliqués
        const playerIds = [
            ...new Set(challenges.flatMap(c => c.players.map(p => p.player_id)))
        ];

        // 4. Récupérer les pseudos correspondants
        const playersFromDb = await Player.find({ _id: { $in: playerIds } }, 'pseudo').lean();

        // 5. Création d’un map rapide ID → pseudo
        const playerIdToName = Object.fromEntries(
            playersFromDb.map(p => [p._id.toString(), p.pseudo])
        );

        // 6. Formater la réponse finale
        const formattedChallenges = challenges.map(challenge => {
            const sortedPlayers = challenge.players
                .sort((a, b) => a.time_taken - b.time_taken)
                .map((player, index) => ({
                    id: player.player_id,
                    name: playerIdToName[player.player_id] || 'Unknown',
                    completionTime: Math.round(player.time_taken),
                    rank: index + 1
                }));

            const dateObj = new Date(challenge.date);
            const isoDate = dateObj.toISOString().split('T')[0];
            const formattedDate = dateObj.toLocaleDateString('fr-FR');

            return {
                id: `game-${isoDate}`,
                challengeId: `dc-${isoDate}`,
                title: challenge.destination_article,
                date: formattedDate,
                players: sortedPlayers
            };
        });

        res.status(200).json(formattedChallenges);
    } catch (error) {
        console.error('Erreur lors de la récupération des challenges :', error);
        res.status(500).json({ error: 'Erreur lors de la récupération des challenges.' });
    }
};
