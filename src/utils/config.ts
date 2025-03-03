// Configuration for API and WebSocket URLs
export const API_BASE_URL = 'http://localhost:5000';
export const WS_BASE_URL = 'ws://localhost:4000';

// Helper functions to build URLs
export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const getWsUrl = () => WS_BASE_URL; 