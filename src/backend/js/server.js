//====================================================================================================

// Server API

//====================================================================================================

import express from "express";
import mongoose from "mongoose";
import playerRoutes from "../routes/playerRoutes.js";
import gameRoutes from "../routes/gameRoutes.js";
import articleRoutes from "../routes/articleRoutes.js";
import artifactRoutes from "../routes/artifactRoutes.js";
import challengeRoutes from "../routes/challengeRoutes.js";
import dotenv from "dotenv";
import cors from 'cors';
import Game from "../models/Game.js";
import Player from "../models/Player.js";
import {WebSocketServer} from "ws";

const PORT = process.env.PORT || 5000;

dotenv.config();

const app = express();
app.use(cors());
const MONGODB_URI = process.env.MONGODB_URI;
const WS_PORT = process.env.WS_PORT || 4000;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in environment variables");
    process.exit(1);
}

app.use(express.json());

// Keep track of clients in each lobby
const lobbies = new Map(); // gameCode -> Set of WebSocket clients
let wss = null;

// Handle game state changes
async function handleGameStateChange(gameCode, event) {
    try {
        console.log(`Handling game state change for ${gameCode}:`, event);
        const game = await Game.findOne({ game_code: gameCode });
        if (!game) {
            console.error(`Game not found: ${gameCode}`);
            return;
        }

        switch (event.type) {
            case 'player_join':
                // Player join is handled by the REST API
                break;

            case 'player_leave':
                const playerId = event.data.playerId;
                game.players = game.players.filter(p => !p.player_id.equals(playerId));

                if (game.players.length === 0) {
                    await Game.deleteOne({ _id: game._id });
                    return;
                }

                // If host leaves, assign new host
                const wasHost = game.players.find(p => p.player_id.equals(playerId))?.is_host;
                if (wasHost && game.players.length > 0) {
                    game.players[0].is_host = true;
                    // Broadcast host change event
                    const newHost = await Player.findById(game.players[0].player_id);
                    if (newHost) {
                        broadcastToLobby(gameCode, {
                            type: 'host_change',
                            data: {
                                newHostId: game.players[0].player_id.toString(),
                                player: {
                                    id: game.players[0].player_id.toString(),
                                    pseudo: newHost.pseudo,
                                    pp: newHost.pp,
                                    is_host: true
                                }
                            }
                        });
                    }
                }
                break;

            case 'settings_update':
                console.log('Updating game settings:', event.data.settings);
                // Initialize settings if they don't exist
                if (!game.settings) {
                    game.settings = {};
                }
                // Update each setting individually
                const newSettings = event.data.settings;
                game.settings.max_players = newSettings.max_players;
                game.settings.time_limit = newSettings.time_limit;
                game.settings.articles_number = newSettings.articles_number;
                game.settings.visibility = newSettings.visibility;
                game.settings.allow_join = newSettings.allow_join;

                console.log('New game settings:', game.settings);
                break;

            case 'game_start':
                if (currentLobby) {
                    try {
                        // First handle the game state change
                        const game = await Game.findOne({ game_code: currentLobby });
                        if (!game) {
                            console.error(`Game not found: ${currentLobby}`);
                            return;
                        }

                        game.status = 'in_progress';
                        game.start_time = new Date();

                        // Save the game first to ensure we have a valid ID
                        await game.save();

                        console.log('Game saved with ID:', game._id.toString());

                        // Distribute random articles
                        const articlesNumber = game.settings?.articles_number || 5;
                        const response = await fetch(`http://localhost:${PORT}/games/random-articles`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                id_game: game._id,
                                number: articlesNumber
                            })
                        });

                        if (!response.ok) {
                            console.error('Failed to distribute random articles');
                        }

                        // Create the game start event
                        const gameStartEvent = {
                            type: 'game_start',
                            data: {
                                gameCode: currentLobby,
                                gameId: game._id.toString()
                            }
                        };

                        // Log the event before broadcasting
                        console.log('Broadcasting game start event:', gameStartEvent);

                        // Broadcast to all clients
                        broadcastToLobby(currentLobby, gameStartEvent);

                        // Save game state again after all operations
                        await game.save();
                    } catch (error) {
                        console.error('Error handling game start:', error);
                    }
                }
                break;

            case 'player_rename':
                const { playerId: playerIdToRename, newName } = event.data;
                const playerToRename = game.players.find(p => p.player_id.equals(playerIdToRename));
                if (playerToRename) {
                    const player = await Player.findById(playerIdToRename);
                    if (player) {
                        player.pseudo = newName;
                        await player.save();
                        broadcastToLobby(gameCode, {
                            type: 'player_rename',
                            data: {
                                playerId: playerIdToRename.toString(),
                                newName: newName
                            }
                        });
                    }
                }
                break;
        }

        await game.save();
        console.log(`Game state updated for ${gameCode}`);
    } catch (error) {
        console.error('Error handling game state change:', error);
    }
}

function setupWebSocketServer() {
    wss = new WebSocketServer({ port: WS_PORT });

    wss.on("connection", (ws) => {
        console.log("Un utilisateur s'est connecté au WebSocket");
        let currentLobby = null;

        ws.on("message", async (message) => {
            try {
                const event = JSON.parse(message);
                console.log(`Message reçu : ${JSON.stringify(event)}`);

                switch (event.type) {
                    case 'player_join':
                        const { gameCode, player } = event.data;
                        if (!lobbies.has(gameCode)) {
                            lobbies.set(gameCode, new Set());
                        }
                        lobbies.get(gameCode).add(ws);
                        currentLobby = gameCode;

                        // Broadcast to all clients in the same lobby
                        broadcastToLobby(gameCode, {
                            type: 'player_join',
                            data: { player }
                        }, ws);
                        break;

                    case 'player_leave':
                        if (currentLobby) {
                            const lobbyClients = lobbies.get(currentLobby);
                            if (lobbyClients) {
                                lobbyClients.delete(ws);
                                if (lobbyClients.size === 0) {
                                    lobbies.delete(currentLobby);
                                }
                            }
                            broadcastToLobby(currentLobby, event, ws);
                            await handleGameStateChange(currentLobby, event);
                        }
                        break;

                    case 'settings_update':
                    case 'game_start':
                        if (currentLobby) {
                            // For settings and game start, broadcast to ALL clients including sender
                            broadcastToLobby(currentLobby, event, null);
                            await handleGameStateChange(currentLobby, event);
                        }
                        break;

                    case 'player_rename':
                        if (currentLobby) {
                            // For rename, broadcast to ALL clients including sender
                            broadcastToLobby(currentLobby, event, null);
                            await handleGameStateChange(currentLobby, event);
                        }
                        break;

                    case 'chat_message':
                        if (currentLobby) {
                            broadcastToLobby(currentLobby, event, ws);
                        }
                        break;
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
            }
        });

        ws.on("close", async () => {
            console.log("Un utilisateur s'est déconnecté");
            if (currentLobby) {
                const lobbyClients = lobbies.get(currentLobby);
                if (lobbyClients) {
                    lobbyClients.delete(ws);
                    if (lobbyClients.size === 0) {
                        lobbies.delete(currentLobby);
                    }
                }
            }
        });
    });

    console.log(`✅ WebSocket server started on port ${WS_PORT}`);
}

function broadcastToLobby(gameCode, event, excludeWs = null) {
    console.log(`Broadcasting to lobby ${gameCode}:`, event);
    const lobbyClients = lobbies.get(gameCode);
    if (lobbyClients) {
        console.log(`Found ${lobbyClients.size} clients in lobby`);
        let sentCount = 0;
        lobbyClients.forEach(client => {
            if ((excludeWs === null || client !== excludeWs) && client.readyState === 1) {
                try {
                    client.send(JSON.stringify(event));
                    sentCount++;
                } catch (error) {
                    console.error('Error sending message to client:', error);
                }
            }
        });
        console.log(`Sent message to ${sentCount} clients`);
    } else {
        console.log(`No clients found in lobby ${gameCode}`);
    }
}

// Connexion MongoDB
mongoose
    .connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000
    })
    .then(() => {
        console.log("✅ MongoDB connected successfully");
        
        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`✅ Server listening on http://localhost:${PORT}`);
        });

        // Start WebSocket server
        setupWebSocketServer();
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err);
        process.exit(1);
    });

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
    await callAPI("/players", { id_game: "67b1f4c36fe85f560dd86791" });
    await callAPI("/artifacts", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
    await callAPI("/current-article", {id_game: "67b1f4c36fe85f560dd86791", id_player: "67a7bc84385c3dc88d87a747"});
}

app.get("/", (req, res) => {
    res.send("API fonctionne !");
});