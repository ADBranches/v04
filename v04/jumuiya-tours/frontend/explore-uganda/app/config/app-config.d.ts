// app/config/app-config.d.ts
declare module '~/config/app-config' {
  export const API_BASE_URL: string;
  export const ENDPOINTS: {
    login: string;
    register: string;
    destinations: string;
    bookings: string;
  };
  export const APP_CONFIG: {
    name: string;
    version: string;
    author: string;
    apiBaseUrl: string;
    endpoints: typeof ENDPOINTS;
    theme: {
      primary: string;
      black: string;
      red: string;
      sand: string;
    };
  };
}
