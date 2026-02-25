import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface OTPResponse {
  otpSent: boolean;
  phone?: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, otp?: string, phone?: string) => Promise<{ otpRequired?: boolean; otpData?: OTPResponse }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }, otp?: string) => Promise<{ otpRequired?: boolean; otpData?: OTPResponse }>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.data.data?.user || response.data.user);
        } catch (error) {
          localStorage.removeItem('authToken');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, otp?: string, phone?: string) => {
    try {
      const response = await authAPI.login(email, password, otp, phone);

      // Check if OTP is required (status 202)
      if (response.status === 202) {
        return {
          otpRequired: true,
          otpData: response.data.data as OTPResponse,
        };
      }

      // Login successful
      const { user, accessToken } = response.data.data;
      localStorage.setItem('authToken', accessToken);
      setUser(user);

      return { otpRequired: false };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }, otp?: string) => {
    try {
      const response = await authAPI.register({ ...data, otp });
      
      console.log('Register API response:', response);
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);

      // Check if OTP is required (status 202)
      if (response.status === 202) {
        console.log('OTP required, returning otpData:', response.data.data);
        return {
          otpRequired: true,
          otpData: response.data.data as OTPResponse,
        };
      }

      // Registration successful
      const { user, accessToken } = response.data.data;
      localStorage.setItem('authToken', accessToken);
      setUser(user);

      return { otpRequired: false };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};