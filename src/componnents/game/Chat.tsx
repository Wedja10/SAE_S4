import React, { useState } from "react";
import '../../style/game/Chat.css';

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([
    "Joueur 1 : Lorem ipsum dolor sit amet.",
    "Joueur 2 : Consectetur adipiscing elit.",
    "Joueur 3 : Sed do eiusmod tempor incididunt."
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      setMessages([...messages, `Moi : ${newMessage}`]);
      setNewMessage("");
    }
  };

  return (
    <div className="chat-container">
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
        <button
          className="chat-send-button"
          onClick={handleSendMessage}
        >
          Envoyer
        </button>
      </div>
    </div>
  );
};

export default Chat;
