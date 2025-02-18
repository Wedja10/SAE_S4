import express from "express";
import mongoose from "mongoose";
import playerRoutes from "../routes/playerRoutes.js";
import gameRoutes from "../routes/gameRoutes.js";
import articleRoutes from "../routes/articleRoutes.js";
import artifactRoutes from "../routes/artifactRoutes.js";
import challengeRoutes from "../routes/challengeRoutes.js";
import dotenv from "dotenv";
dotenv.config()

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connecté"))
    .catch((err) => console.error(err));

// Routes API
app.use("/players", playerRoutes); // Ajouter la route /players
app.use("/games", gameRoutes); // Ajouter la route /games
app.use("/articles", articleRoutes); // Ajouter la route /articles
app.use("/artifacts", artifactRoutes); // Ajouter la route /artifacts
app.use("/challenges", challengeRoutes); // Ajouter la route /challenges

app.get("/", (req, res) => {
    res.send("API fonctionne !");
});

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
