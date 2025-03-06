export const StorageKeys = {
    PLAYER_ID: 'playerId',
    GAME_ID: 'gameId',
    GAME_CODE: 'gameCode',
    USER_SETTINGS: 'userSettings',
    PLAYER_NAME: 'playerName',
    PROFILE_PICTURE: 'profilePicture',
    PROFILE_PICTURE_COLOR: 'profilePictureColor'
} as const;

export const Storage = {
    getPlayerId: () => localStorage.getItem(StorageKeys.PLAYER_ID),
    setPlayerId: (id: string) => localStorage.setItem(StorageKeys.PLAYER_ID, id),
    getGameId: () => localStorage.getItem(StorageKeys.GAME_ID),
    setGameId: (id: string) => localStorage.setItem(StorageKeys.GAME_ID, id),
    getGameCode: () => localStorage.getItem(StorageKeys.GAME_CODE),
    setGameCode: (code: string) => localStorage.setItem(StorageKeys.GAME_CODE, code),
    getPlayerName: () => localStorage.getItem(StorageKeys.PLAYER_NAME),
    setPlayerName: (name: string) => localStorage.setItem(StorageKeys.PLAYER_NAME, name),
    getProfilePicture: () => localStorage.getItem(StorageKeys.PROFILE_PICTURE),
    setProfilePicture: (url: string) => localStorage.setItem(StorageKeys.PROFILE_PICTURE, url),
    getProfilePictureColor: () => localStorage.getItem(StorageKeys.PROFILE_PICTURE_COLOR),
    setProfilePictureColor: (color: string) => localStorage.setItem(StorageKeys.PROFILE_PICTURE_COLOR, color),
    getUserSettings: () => {
        const settings = localStorage.getItem(StorageKeys.USER_SETTINGS);
        return settings ? JSON.parse(settings) : null;
    },
    setUserSettings: (settings: object) => {
        localStorage.setItem(StorageKeys.USER_SETTINGS, JSON.stringify(settings));
    },
    clear: () => {
        localStorage.removeItem(StorageKeys.PLAYER_ID);
        localStorage.removeItem(StorageKeys.GAME_ID);
        localStorage.removeItem(StorageKeys.GAME_CODE);
        localStorage.removeItem(StorageKeys.USER_SETTINGS);
        localStorage.removeItem(StorageKeys.PLAYER_NAME);
        localStorage.removeItem(StorageKeys.PROFILE_PICTURE);
        localStorage.removeItem(StorageKeys.PROFILE_PICTURE_COLOR);
    }
}; 