export interface Destination {
  id: number;
  name: string;
  region: string;
  description: string;
  short_description?: string;
  price_range: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  featured: boolean;
  images?: string[];
  created_by?: number;
  district?: string;
}

export interface GuideVerification {
  id: number;
  name: string;
  email: string;
  guide_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  verification_submitted_at: string;
  created_at: string;
}

export interface DashboardStats {
  total_destinations?: number;
  pending_destinations?: number;
  total_verifications?: number;
  pending_verifications?: number;
}