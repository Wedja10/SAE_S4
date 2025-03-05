import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ProfilePicture.css';

interface ProfilePictureProps {
  currentPicture: string;
  isCurrentPlayer: boolean;
  onPictureChange: (newPictureUrl: string, skinColor?: string) => void;
  currentSkinColor?: string;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
  currentPicture,
  isCurrentPlayer,
  onPictureChange,
  currentSkinColor
}) => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [skinColor, setSkinColor] = useState(currentSkinColor || '#FFAD80');
  const observer = useRef<IntersectionObserver | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const portalRoot = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create portal root if it doesn't exist
    if (!document.getElementById('avatar-selector-portal')) {
      const div = document.createElement('div');
      div.id = 'avatar-selector-portal';
      document.body.appendChild(div);
      portalRoot.current = div;
    } else {
      portalRoot.current = document.getElementById('avatar-selector-portal') as HTMLDivElement;
    }

    return () => {
      if (portalRoot.current && !document.getElementById('avatar-selector-portal')) {
        document.body.removeChild(portalRoot.current);
      }
    };
  }, []);

  const generateRandomSeed = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const generateAvatars = useCallback((count: number) => {
    const newAvatars = [];
    for (let i = 0; i < count; i++) {
      const seed = generateRandomSeed();
      newAvatars.push(`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${seed}&backgroundColor=transparent`);
    }
    return newAvatars;
  }, []);

  const loadMoreAvatars = useCallback(() => {
    if (!loading) {
      setLoading(true);
      const newAvatars = generateAvatars(9);
      setAvatars(prev => [...prev, ...newAvatars]);
      setPage(prev => prev + 1);
      setLoading(false);
    }
  }, [generateAvatars, loading]);

  const lastAvatarRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        loadMoreAvatars();
      }
    });

    if (node) observer.current.observe(node);
  }, [loadMoreAvatars, loading]);

  useEffect(() => {
    if (avatars.length === 0) {
      loadMoreAvatars();
    }
  }, [avatars.length, loadMoreAvatars]);

  useEffect(() => {
    if (currentSkinColor) {
      setSkinColor(currentSkinColor);
    }
  }, [currentSkinColor]);

  const handlePictureSelect = (url: string) => {
    const pictureUrl = url.trim();
    if (pictureUrl) {
      onPictureChange(pictureUrl, skinColor);
      setIsSelecting(false);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentPlayer) {
      setIsSelecting(prev => !prev);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (e.target === e.currentTarget) {
      setIsSelecting(false);
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkinColor(e.target.value);
  };

  const renderAvatarWithBackground = (url: string, bgColor?: string) => (
    <div className="avatar-with-background" style={{ backgroundColor: bgColor || '#FFAD80' }}>
      <img src={url} alt="Avatar" />
    </div>
  );

  const renderSelector = () => {
    if (!isSelecting || !portalRoot.current) return null;

    return createPortal(
      <div className="overlay" onClick={handleOverlayClick}>
        <div 
          className="avatar-selector" 
          ref={containerRef} 
          onClick={e => e.stopPropagation()}
        >
          <h2 className="selector-title">Choose Avatar</h2>
          <div className="color-picker-container">
            <label>Skin tone:</label>
            <input
              type="color"
              className="skin-color-picker"
              value={skinColor}
              onChange={handleColorChange}
            />
          </div>
          <div className="avatar-grid-container">
            <div className="avatar-grid">
              {avatars.map((url, index) => (
                <div
                  key={url + index} 
                  ref={index === avatars.length - 1 ? lastAvatarRef : null}
                  className="avatar-option"
                  onClick={() => handlePictureSelect(url)}
                >
                  {renderAvatarWithBackground(url, skinColor)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>,
      portalRoot.current
    );
  };

  return (
    <div className="profile-picture-container" onClick={(e) => e.stopPropagation()}>
      <div 
        className={`profile-picture-wrapper ${isCurrentPlayer ? 'clickable' : ''}`}
        onClick={handleProfileClick}
      >
        {renderAvatarWithBackground(currentPicture, currentSkinColor)}
        {isCurrentPlayer && (
          <div className="edit-icon-wrapper">
            <img
              src="/assets/edit.svg"
              alt="Change picture"
              className="edit-icon picture-edit"
            />
          </div>
        )}
      </div>
      {renderSelector()}
    </div>
  );
};