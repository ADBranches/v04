// app/types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginationMeta {
  page: number;
  pages: number;
  total: number;
  limit: number;
}

