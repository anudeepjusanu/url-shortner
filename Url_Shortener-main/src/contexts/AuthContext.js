import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        loading: false,
        error: null,
      };

    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case actionTypes.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };

    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check authentication status
  const checkAuthStatus = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
      return;
    }

    try {
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        dispatch({ type: actionTypes.SET_USER, payload: response.data.user });
      } else {
        // Invalid token, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: actionTypes.SET_LOADING, payload: false });
    }
  };

  // Login function
  const login = async (email, password) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.CLEAR_ERROR });

    try {
      const response = await authAPI.login({ email, password });

      if (response.success && response.data) {
        dispatch({ type: actionTypes.SET_USER, payload: response.data.user });
        return { success: true, user: response.data.user };
      } else {
        const errorMessage = response.message || 'Login failed';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });
    dispatch({ type: actionTypes.CLEAR_ERROR });

    try {
      const response = await authAPI.register(userData);

      if (response.success && response.data) {
        dispatch({ type: actionTypes.SET_USER, payload: response.data.user });
        return { success: true, user: response.data.user };
      } else {
        const errorMessage = response.message || 'Registration failed';
        dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      dispatch({ type: actionTypes.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    dispatch({ type: actionTypes.SET_LOADING, payload: true });

    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: actionTypes.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  // Update user profile
  const updateUser = (userData) => {
    dispatch({ type: actionTypes.SET_USER, payload: userData });
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;