// app/utils/constants.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE || "/api";

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 12,
};

export const REGIONS = ["Central", "Eastern", "Northern", "Western"] as const;

export const DIFFICULTY_LEVELS = ["Easy", "Moderate", "Difficult"] as const;
