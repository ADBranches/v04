export interface Guide {
  id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  profile_image?: string;
  bio?: string;
  regions?: string[] | string;
  languages?: string[] | string;
  experience_years?: number;
  verification_status?: 'verified' | 'pending' | 'unverified';
  specialties?: string[];
  hourly_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GuideVerification {
  id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected';
  credentials: {
    experience: string;
    certifications: string[];
  };
  documents: string[];
  notes?: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
}

export interface GuideResponse {
  guides: Guide[];
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface GuideFilterParams {
  page?: number;
  limit?: number;
  region?: string;
  status?: string;
  search?: string;
}

export interface VerificationCredentials {
  experience: string;
  certifications: string[];
}