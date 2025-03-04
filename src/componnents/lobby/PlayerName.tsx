import React, { useState } from 'react';
import './PlayerName.css';

interface PlayerNameProps {
  name: string;
  isCurrentPlayer: boolean;
  onRename: (newName: string) => void;
}

export const PlayerName: React.FC<PlayerNameProps> = ({ name, isCurrentPlayer, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(name);
  const [error, setError] = useState<string | null>(null);

  const validateName = (name: string): { isValid: boolean; error: string | null } => {
    if (name.length <= 2 || name.length > 18 || !name.match(/^[a-zA-Z0-9_-]+$/)) {
      return { isValid: false, error: 'Invalid name' };
    }
    return { isValid: true, error: null };
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    const trimmedValue = inputValue.trim();
    const validation = validateName(trimmedValue);
    
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setError(null);
    onRename(trimmedValue);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="player-name">
        <span>{name}</span>
        {isCurrentPlayer && (
          <img
            src="/assets/edit.svg"
            alt="Edit name"
            className="edit-icon"
            onClick={() => setIsEditing(true)}
          />
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="player-name-edit">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setInputValue(newValue);
          // Validate in real-time, but only if there's actual input
          if (newValue.trim()) {
            const validation = validateName(newValue.trim());
            setError(validation.error);
          } else {
            setError(null);
          }
        }}
        maxLength={18}
        autoFocus
        onBlur={(e) => {
          if (e.target.value === name) {
            setIsEditing(false);
          }
        }}
      />
      {!error && (
        <button 
          type="submit" 
          className="confirm-button"
          onClick={() => handleSubmit()}
        >
          <svg 
            className="confirm-icon" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        </button>
      )}
      {error && <div className="name-error">{error}</div>}
    </form>
  );
}; 