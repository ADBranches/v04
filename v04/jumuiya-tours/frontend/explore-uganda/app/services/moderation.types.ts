export interface ModerationLog {
  id: number;
  content_type: 'destination' | 'guide' | 'booking' | 'user';
  content_id: number;
  action: string;
  moderator_id?: number;
  notes?: string;
  previous_values?: any;
  new_values?: any;
  created_at: string;
  rejection_reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  submitted_by?: number;
  submitter?: {
    name: string;
    email: string;
  };
  moderator?: {
    name: string;
    email: string;
  };
  content?: any;
  destination?: {
    id: number;
    name: string;
    description: string;
    region: string;
    difficulty?: string;
    price_range?: string;
    images: string[];
  };
}

export interface ModerationResponse {
  content: ModerationLog[];
  pagination: {
    page: number;
    pages: number;
    total: number;
  };
}

export interface ModerationFilterParams {
  page?: number;
  limit?: number;
  content_type?: string;
  status?: string;
}