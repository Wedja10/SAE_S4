import { WebSocketServer } from "ws";
import dotenv from "dotenv";

dotenv.config();

const PORT_WS = process.env.PORT_WS || 5001;
const clients = new Set();

const wss = new WebSocketServer({ port: PORT_WS });

wss.on("connection", (ws) => {
    console.log("Un utilisateur s'est connecté au WebSocket");
    clients.add(ws);

    ws.on("message", (message) => {
        console.log(`Message reçu : ${message}`);

        clients.forEach(client => {
            if (client !== ws && client.readyState === 1) {
                client.send(message); // Envoyer aux autres utilisateurs
            }
        });
    });



    ws.on("close", () => {
        console.log("Un utilisateur s'est déconnecté");
        clients.delete(ws);
    });
});

console.log(`Serveur WebSocket en écoute sur ws://localhost:${PORT_WS}`);
