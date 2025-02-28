import Article from "../models/Article.js";

export const getViews = async (title) => {
    try {
        const formattedTitle = encodeURIComponent(title.replace(/ /g, '_'));

        // Calculer la période pour le mois dernier
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const firstDayOfLastMonth = lastMonth.toISOString().slice(0, 10).replace(/-/g, '');
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10).replace(/-/g, '');

        const pageviewsUrl = `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/fr.wikipedia.org/all-access/user/${formattedTitle}/daily/${firstDayOfLastMonth}/${lastDayOfLastMonth}`;

        const response = await fetch(pageviewsUrl);
        if (!response.ok) {
            console.warn(`Aucune donnée de vues pour l'article "${title}". Erreur: ${response.status} - ${response.statusText}`);
            return { title, pageviewsData: null, totalViews: 0 };
        }

        const pageviewsData = await response.json();
        if (!pageviewsData.items || pageviewsData.items.length === 0) {
            console.warn(`Pas de données de vues disponibles pour "${title}".`);
            return { title, pageviewsData: null, totalViews: 0 };
        }

        return pageviewsData.items.reduce((sum, item) => sum + item.views, 0);
    } catch (error) {
        console.error(`Erreur lors de la récupération des vues pour "${title}" :`, error);
        return { title, pageviewsData: null, totalViews: 0 };
    }
};

export const createArticle = async (title) => {
    try {
        const popularity = getViews(title);
        const newArticle = new Article({ title, popularity });
        return await newArticle.save();
    } catch (error) {
        console.error("Erreur dans createArticle :", error);
        return null;
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
