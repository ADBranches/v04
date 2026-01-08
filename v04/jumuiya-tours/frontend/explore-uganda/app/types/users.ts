// app/types/users.ts
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "guide" | "auditor" | "user";
  bio?: string;
  phone?: string;
  location?: string;
  languages?: string[];
  specialties?: string[];
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

