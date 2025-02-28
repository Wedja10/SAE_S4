export const StorageKeys = {
    PLAYER_ID: 'playerId',
    GAME_ID: 'gameId',
    GAME_CODE: 'gameCode',
    USER_SETTINGS: 'userSettings'
} as const;

export const Storage = {
    getPlayerId: () => localStorage.getItem(StorageKeys.PLAYER_ID),
    setPlayerId: (id: string) => localStorage.setItem(StorageKeys.PLAYER_ID, id),
    getGameId: () => localStorage.getItem(StorageKeys.GAME_ID),
    setGameId: (id: string) => localStorage.setItem(StorageKeys.GAME_ID, id),
    getGameCode: () => localStorage.getItem(StorageKeys.GAME_CODE),
    setGameCode: (code: string) => localStorage.setItem(StorageKeys.GAME_CODE, code),
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
    }
}; 