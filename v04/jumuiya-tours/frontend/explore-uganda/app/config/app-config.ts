export const DEV_API_BASE = 'http://localhost:5000/api';
export const PROD_API_BASE = 'https://production-domain.com/api';
export const API_BASE_URL =
  import.meta.env.MODE === 'production' ? PROD_API_BASE : DEV_API_BASE;

export const ENDPOINTS = {
  login: `${API_BASE_URL}/auth/login`,
  register: `${API_BASE_URL}/auth/register`,
  destinations: `${API_BASE_URL}/destinations`,
  bookings: `${API_BASE_URL}/bookings`,
};

export const APP_CONFIG = {
  name: 'Explore Uganda',
  version: '1.0.0',
  author: 'Jumuiya Tours Dev Team',
  apiBaseUrl: API_BASE_URL,
  endpoints: ENDPOINTS,
  theme: {
    primary: '#FFC107',
    black: '#000000',
    red: '#E31837',
    sand: '#F5F5DC',
  },
};
