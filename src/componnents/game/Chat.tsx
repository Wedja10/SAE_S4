import React, { useState, useEffect, useRef } from "react";
import '../../style/game/Chat.css';

const WS_URL = `ws://localhost:3001`;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const ws = useRef<WebSocket | null>(null);

  // Connexion au WebSocket
  useEffect(() => {
    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => console.log("✅ Connecté au WebSocket");
    ws.current.onerror = (error) => console.error("❌ Erreur WebSocket :", error);
    ws.current.onclose = () => console.log("🔴 WebSocket fermé");

    ws.current.onmessage = (event) => {
      console.log("Message reçu du serveur :", event.data);
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      ws.current?.close();
    };
  }, []);


  const handleSendMessage = () => {
    if (newMessage.trim() !== "" && ws.current) {
      const formattedMessage = `Moi : ${newMessage}`;
      ws.current.send(formattedMessage); // Envoi au serveur WebSocket
      setMessages((prevMessages) => [...prevMessages, formattedMessage]); // Ajout immédiat côté client
      setNewMessage(""); // Réinitialisation de l'input
    }
  };


  return (
      <div className="chat-container fade-in">
        <h2 className="chat-title">Chat</h2>
        <div className="chat-box">
          {messages.map((msg, index) => (
              <p key={index} className="chat-message">{msg}</p>
          ))}
        </div>
        <div className="sendcontainer">
          <input
              type="text"
              className="chat-input"
              placeholder="Écrire un message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
          />
          <button className="chat-send-button" onClick={handleSendMessage}>
            Envoyer
          </button>
        </div>
      </div>
  );
};

export default Chat;
