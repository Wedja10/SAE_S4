import express from "express";
import mongoose from "mongoose";
import playerRoutes from "../routes/playerRoutes.js";
import gameRoutes from "../routes/gameRoutes.js";
import articleRoutes from "../routes/articleRoutes.js";
import artifactRoutes from "../routes/artifactRoutes.js";
import challengeRoutes from "../routes/challengeRoutes.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

// Connexion MongoDB
mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connecté"))
    .catch((err) => console.error(err));

// Routes API
app.use("/players", playerRoutes);
app.use("/games", gameRoutes);
app.use("/articles", articleRoutes);
app.use("/artifacts", artifactRoutes);
app.use("/challenges", challengeRoutes);

async function callAPI(endpoint, body) {
    try {
        const response = await fetch(`http://localhost:${PORT}/games${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error(`Erreur ${response.status}`);

        const data = await response.json();
        console.log(`Réponse de ${endpoint} :`, data);
        return data;
    } catch (error) {
        console.error(`Erreur lors de la requête vers ${endpoint} :`, error);
    }
}

async function testAPI() {
    // await callAPI("/players", { id_game: "67b1f4c36fe85f560dd86791" });
    // await callAPI("/create-game", { id_creator: "67a7bc84385c3dc88d87a748" });
    // await callAPI("/articles", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/found-articles", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/artifacts", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/random-articles", {id_game: "67b708100a007de8bbf95bc0", number: 5});
    // await callAPI("/back-artifact", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/mine-artifact", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/eraser-artifact", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    // await callAPI("/disorienter-artifact", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    await callAPI("/dictator-artifact", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
}

// Appel de la fonction testAPI après le démarrage du serveur
app.get("/", (req, res) => {
    res.send("API fonctionne !");
});

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
    testAPI(); // Lancer le test après le démarrage
});
