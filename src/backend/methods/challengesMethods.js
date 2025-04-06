import Challenge from "../models/Game.js";
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