import Article from "../models/Article.js";
import fs from 'fs';
import readline from 'readline';


async function countLine(pathFile) {
    const fileStream = fs.createReadStream(pathFile);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let compteur = 0;

    for await (const ligne of rl) {
        compteur++;
    }
    return compteur;
}

export const insertArticle = async (req, res) => {
    const { pathFile } = req.body;

    try {
        console.log("Début de l'insertion...");
        await Article.deleteMany({});
        console.log("Base vidée.");

        const count = await countLine(pathFile);
        console.log(`Nombre total de lignes : ${count}`);

        if (count === 0) {
            console.warn("Le fichier est vide !");
            return res.status(400).json({ message: "Le fichier ne contient aucune donnée" });
        }

        const fileStream = fs.createReadStream(pathFile);
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

        const topTenPercent = parseInt(count / 10);
        let compteur = 0;
        const articles = [];

        console.log("Début du traitement des lignes...");

        for await (const ligne of rl) {
            compteur++;
            console.log(`Ligne ${compteur} : ${ligne}`);

            const match = ligne.match(/^(.+?)\t(\d+)$/);
            console.log(`Résultat du match :`, match);

            if (match) {
                const title = match[1];
                let popular = compteur < topTenPercent;

                console.log({ title, popular });
                articles.push(new Article({ title, popular }));
            } else {
                console.warn(`Ligne mal formée : ${ligne}`);
            }

            if (articles.length >= 1000) {
                await Article.insertMany(articles);
                articles.length = 0; // Vide le tableau
                console.log(`Lot de 1000 articles insérés. Ligne actuelle : ${compteur}`);
            }
        }

        // Insère les articles restants
        if (articles.length > 0) {
            await Article.insertMany(articles);
            console.log("Dernier lot d'articles insérés.");
        }

        console.log("Insertion terminée avec succès !");

        const articlesInDb = await Article.find();
        console.log("Articles en base après insertion :", articlesInDb);

        res.status(200).json({ message: "Articles insérés avec succès" });
    } catch (e) {
        console.error("Erreur lors de l'insertion :", e);
        res.status(500).json({ message: "Erreur lors de l'insertion des articles" });
    }
};

export const getViews = async (title) => {
    try {
        const formattedTitle = encodeURIComponent(title.replace(/ /g, '_'));

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayOfLastMonth = lastMonth.toISOString().slice(0, 10).replace(/-/g, '');
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10).replace(/-/g, '');

        const pageviewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia.org/all-access/user/${formattedTitle}/daily/${firstDayOfLastMonth}/${lastDayOfLastMonth}`;

        const response = await fetch(pageviewsUrl);

        if (!response.ok) {
            console.warn(`Aucune donnée de vues pour l'article "${title}".`);
            return 0;  // ⚠️ Retourne juste un nombre
        }

        const pageviewsData = await response.json();

        if (!pageviewsData.items || pageviewsData.items.length === 0) {
            console.warn(`Pas de données de vues disponibles pour "${title}".`);
            return 0;  // ⚠️ Retourne juste un nombre
        }

        return pageviewsData.items.reduce((sum, item) => sum + item.views, 0);
    } catch (error) {
        console.error(`Erreur lors de la récupération des vues pour "${title}" :`, error);
        return 0;  // ⚠️ Retourne juste un nombre même en cas d'erreur
    }
};


export const createArticle = async (title) => {
    try {
        if (!title || typeof title !== "string") {
            throw new Error("Titre invalide");
        }

        const formattedTitle = title.replace(/ /g, "_");
        let existingArticle = await Article.findOne({ title: formattedTitle });

        if (existingArticle) {
            return existingArticle;
        }

        const newArticle = new Article({ title: formattedTitle, popular: false });
        return await newArticle.save();
    } catch (error) {
        console.error("Erreur dans createArticle :", error);
        throw error; // Propager l'erreur pour gestion externe
    }
};

export const createArticleFront = async (req, res) => {
    const { title } = req.body;
    try {
        if (!title || typeof title !== "string") {
            return res.status(400).json({ message: "Titre invalide" });
        }

        const formattedTitle = title.replace(/ /g, "_");
        let existingArticle = await Article.findOne({ title: formattedTitle });

        if (existingArticle) {
            return res.status(200).json({ message: "Article déjà existant", article: existingArticle });
        }

        const newArticle = new Article({ title: formattedTitle, popular: false });
        const savedArticle = await newArticle.save();
        return res.status(201).json({ article: savedArticle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'insertion des articles" });
    }
};



export const generateRandomArticle = async () => {
    try {
        const url = 'https://fr.wikipedia.org/api/rest_v1/page/random/summary';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération de l'article aléatoire : ${response.statusText}`);
        }

        const data = await response.json();
        const totalViews = await getViews(data.title);

        return { title: data.title, totalViews };
    } catch (error) {
        console.error("Erreur dans generateRandomArticle :", error);
        throw error;
    }
};
