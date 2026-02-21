import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { projectCache } from '@/services/projectCache.service';
import type { User, LoginCredentials, SignupCredentials } from '@/types/auth';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Load user on mount - optimistic: use cache if available for instant load
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      const cached = authService.getUserCache();
      if (cached) {
        setUser(cached);
        setIsLoading(false);
      }
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        authService.setUserCache(userData);
      } catch {
        authService.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const tokens = await authService.login(credentials);
      projectCache.clear();
      queryClient.removeQueries({ queryKey: ['github-project'] });
      authService.setTokens(tokens);

      const userData = await authService.getCurrentUser();
      setUser(userData);
      authService.setUserCache(userData);

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      const tokens = await authService.signup(credentials);
      projectCache.clear();
      queryClient.removeQueries({ queryKey: ['github-project'] });
      authService.setTokens(tokens);

      const userData = await authService.getCurrentUser();
      setUser(userData);
      authService.setUserCache(userData);

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Signup failed';
      toast.error(message);
      throw error;
    }
  };

  const loginWithGoogle = async (code: string) => {
    try {
      const tokens = await authService.loginWithGoogle(code);
      projectCache.clear();
      queryClient.removeQueries({ queryKey: ['github-project'] });
      authService.setTokens(tokens);

      const userData = await authService.getCurrentUser();
      setUser(userData);
      authService.setUserCache(userData);

      toast.success('Google login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Google login failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      authService.clearTokens();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
