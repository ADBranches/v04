// Core User Interface
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'guide' | 'auditor' | 'admin';
  guide_status: 'unverified' | 'pending' | 'verified';
  is_verified_guide: boolean;
  created_at?: string;
  updated_at?: string;
}

// Request Interfaces
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
  token?: string;
  new_password?: string;
}

// Response Interfaces
export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  code?: number;
}

export interface RegisterResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
  code?: number;
}

export interface PasswordResetResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: number;
}

// Validation & Utility Interfaces
export interface PasswordValidation {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumbers: boolean;
    hasSpecialChar: boolean;
  };
  strength: 'weak' | 'medium' | 'strong';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

export interface AuthContextType {
  authState: AuthState;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  register: (userData: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (user: Partial<User>) => void;
}

// Error Types
export interface AuthError {
  code: string;
  message: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Session Types
export interface SessionInfo {
  user: User;
  expires_at: string;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

// Permission Types
export interface Permission {
  resource: string;
  actions: string[];
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}

// Event Types
export interface AuthEvent {
  type: 'login' | 'logout' | 'token_expired' | 'user_updated' | 'session_refreshed';
  user?: User;
  timestamp: string;
  metadata?: Record<string, any>;
}

// API Response Wrappers
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  timestamp?: string;
}

// Form State Types
export interface LoginFormState {
  email: string;
  password: string;
  remember_me: boolean;
}

export interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  accept_terms: boolean;
}

// Hook Return Types
export interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: string | string[]) => boolean;
  hasPermission: (resource: string, action: string) => boolean;
}

// Configuration Types
export interface AuthConfig {
  tokenRefreshInterval: number;
  sessionTimeout: number;
  autoRefresh: boolean;
  storageKey: string;
}

// Export all types for easy importing
export type {
  User as AuthUser,
  LoginRequest as SignInRequest,
  RegisterRequest as SignUpRequest,
  LoginResponse as SignInResponse,
  RegisterResponse as SignUpResponse,
};