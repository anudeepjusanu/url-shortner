import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/services/api';
import amplitudeService from '@/services/amplitude';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; password?: string; phoneNumber?: string; otp?: string }) => Promise<any>;
  loginWithPhone: (credentials: { phoneNumber: string; otp?: string }) => Promise<any>;
  register: (userData: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken');
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          if (response.success) {
            // Profile endpoint returns user fields at root level; data.user has the full object
            const userData = response.data?.user || response.data || response;
            setUser(userData);
            amplitudeService.setUser(userData.id || userData._id, {
              email: userData.email,
              role: userData.role,
            });
          }
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Clear invalid token
          localStorage.removeItem('authToken');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email?: string; password?: string; phoneNumber?: string; otp?: string }) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success && response.data) {
        // Check if OTP is required
        if (response.otpRequired) {
          return response;
        }
        
        // Set user data
        if (response.data.user) {
          setUser(response.data.user);
          amplitudeService.trackLogin(response.data.user.id, 'email');
        }
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithPhone = async (credentials: { phoneNumber: string; otp?: string }) => {
    try {
      const response = await authAPI.loginWithPhone(credentials);

      if (response.success && response.data) {
        if (response.otpRequired) {
          return response;
        }
        if (response.data.user) {
          setUser(response.data.user);
          amplitudeService.trackLogin(response.data.user.id, 'phone');
        }
      }

      return response;
    } catch (error) {
      console.error('Phone login error:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success && response.data) {
        // Check if OTP is required
        if (response.otpRequired) {
          return response;
        }
        
        // Set user data
        if (response.data.user) {
          setUser(response.data.user);
          amplitudeService.trackRegistrationCompleted(response.data.user.id, {
            email: response.data.user.email,
            role: response.data.user.role,
            registration_method: 'email',
          });
        }
      }

      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      amplitudeService.trackLogout();
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.success) {
        const userData = response.data?.user || response.data || response;
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithPhone,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
