export interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  profile_picture?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface AuthResponse extends AuthTokens {
  user?: User;
}
