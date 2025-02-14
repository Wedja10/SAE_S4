import express from "express";
import mongoose from "mongoose";
import playerRoutes from "../routes/playerRoutes.js";

const app = express();
const PORT = 5000;
const MONGODB_URI = "mongodb+srv://:@cluster0.8sjgk.mongodb.net/main?retryWrites=true&w=majority&appName=Cluster0";

app.use(express.json());

mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connecté"))
    .catch((err) => console.error(err));

// Routes API
app.use("/players", playerRoutes); // Ajouter la route /users

app.get("/", (req, res) => {
    res.send("API fonctionne !");
});

app.listen(PORT, () => {
    console.log(`Serveur en écoute sur http://localhost:${PORT}`);
});
