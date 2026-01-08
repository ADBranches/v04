// app/types/destinations.ts
export interface Destination {
  id: number;
  name: string;
  region: string;
  difficulty_level: string;
  short_description?: string;
  description?: string;
  featured?: boolean;
  images?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface FilterParams {
  search?: string;
  region?: string;
  difficulty?: string;
  featured?: boolean;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

