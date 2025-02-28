// Configuration for API and WebSocket URLs
export const API_BASE_URL = 'http://localhost:5000';
export const WS_BASE_URL = 'ws://localhost:4000';

// Helper functions to build URLs
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export const getWsUrl = (): string => {
  return WS_BASE_URL;
}; 