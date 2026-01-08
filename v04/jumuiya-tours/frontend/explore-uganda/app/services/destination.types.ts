export interface Destination {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  location: string;
  region: string;
  district?: string;
  price_range: string;
  duration: string;
  difficulty_level: string;
  best_season: string;
  highlights: string[];
  included: string[];
  not_included: string[];
  requirements?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  featured: boolean;
  images?: string[];
  created_by?: number;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDestinationRequest {
  name: string;
  description: string;
  short_description: string;
  location: string;
  region: string;
  district?: string;
  price_range: string;
  duration: string;
  difficulty_level: string;
  best_season: string;
  highlights: string[];
  included: string[];
  not_included: string[];
  requirements?: string;
}

export interface UpdateDestinationRequest extends CreateDestinationRequest {}

export interface DestinationResponse {
  destinations: Destination[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface FilterParams {
  page?: number;
  limit?: number;
  region?: string;
  difficulty?: string;
  featured?: boolean;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string;
  created_by?: number;
}