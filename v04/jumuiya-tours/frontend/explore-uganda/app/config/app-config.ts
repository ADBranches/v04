// app/config/app-config.ts

// 🔹 1. Dev/Prod fallbacks (kept, but used as fallback only)
export const DEV_API_BASE = 'http://localhost:5000/api';
export const PROD_API_BASE = 'https://production-domain.com/api';

const FALLBACK_API_BASE =
  import.meta.env.MODE === 'production' ? PROD_API_BASE : DEV_API_BASE;

// 🔹 2. Single source of truth, preferring environment variable
// Make sure VITE_API_BASE_URL matches your $BASE_URL in curl/api-smoke.sh
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? FALLBACK_API_BASE;

// 🔹 3. Centralized endpoints
export const ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  destinations: `${API_BASE_URL}/destinations`,
  bookings: `${API_BASE_URL}/bookings`,
};

// 🔹 4. App-wide config object (with feature flag)
export const APP_CONFIG = {
  name: 'Jumuiya Tours',
  version: '1.0.0',
  author: 'Jumuiya Tours Dev Team',
  apiBaseUrl: API_BASE_URL,
  endpoints: ENDPOINTS,
  ENABLE_REGISTRATION: true, // <-- new feature flag
  theme: {
    primary: '#FFC107',
    black: '#000000',
    red: '#E31837',
    sand: '#F5F5DC',
  },
};