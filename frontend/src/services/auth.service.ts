import { api } from '@/lib/axios';
import type {
  LoginCredentials,
  SignupCredentials,
  AuthTokens,
  User,
} from '@/types/auth';

export const authService = {
  async signup(credentials: SignupCredentials): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/api/auth/signup', credentials);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/api/auth/login', credentials);
    return response.data;
  },

  async loginWithGoogle(code: string): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/api/auth/google', { code });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/api/auth/refresh', {
      refresh_token: refreshToken,
      token_type: 'bearer',
    });
    return response.data;
  },

  // Token management
  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
  },

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_cache');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },

  getUserCache(): User | null {
    try {
      const cached = sessionStorage.getItem('user_cache');
      return cached ? (JSON.parse(cached) as User) : null;
    } catch {
      return null;
    }
  },

  setUserCache(user: User | null): void {
    if (user) {
      sessionStorage.setItem('user_cache', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('user_cache');
    }
  },
};
