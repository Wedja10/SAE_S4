import Article from "../models/Article.js";

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

        const totalViews = pageviewsData.items.reduce((sum, item) => sum + item.views, 0);

        return totalViews;  // ✅ Retourne juste le nombre total
    } catch (error) {
        console.error(`Erreur lors de la récupération des vues pour "${title}" :`, error);
        return 0;  // ⚠️ Retourne juste un nombre même en cas d'erreur
    }
};



export const createArticle = async (title) => {
    try {
        const existingArticle = await Article.findOne({ title });
        if (existingArticle) {
            return existingArticle;
        }

        const popularity = await getViews(title);
        const newArticle = new Article({ title, popularity });

        return await newArticle.save();
    } catch (error) {
        console.error("Erreur dans createArticle :", error);
        return null;
    }
};

export const createArticleFront = async (req, res) => {
    const { title } = req.body;
    try {
        const existingArticle = await Article.findOne({ title });
        if (existingArticle) {
            return res.status(200).json(existingArticle);  // ✅ On répond via res.json()
        }

        const popularity = await getViews(title);
        const newArticle = new Article({ title, popularity });

        const savedArticle = await newArticle.save();

        res.status(201).json(savedArticle);  // ✅ On répond via res.json()
    } catch (error) {
        console.error("Erreur dans createArticle :", error);
        res.status(500).json({ message: "Erreur serveur" });  // ✅ On renvoie une vraie erreur HTTP
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
        const totalViews = await getViews(data.title);  // ✅ Ajout de "await"

        return { title: data.title, totalViews };
    } catch (error) {
        console.error("Erreur dans generateRandomArticle :", error);
        throw error;
    }
};
