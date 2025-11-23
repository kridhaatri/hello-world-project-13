// API Configuration
// This file centralizes API endpoint configuration

export const API_CONFIG = {
  // Use production backend URL when deployed, local for development
  baseUrl: import.meta.env.VITE_API_URL || 
    (import.meta.env.PROD 
      ? 'https://your-backend.azurewebsites.net/api'
      : 'http://localhost:3000/api'),
  
  // Timeout for API requests (milliseconds)
  timeout: 30000,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 1000,
};

// Helper to check if we're in development mode
export const isDevelopment = import.meta.env.DEV;

// Helper to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.baseUrl}${endpoint}`;
};
