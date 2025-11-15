import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to get current user:', error);
          if (error?.response?.status === 401) {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          } else {
            // Keep token for non-auth errors (e.g., 404 /auth/me not implemented, 5xx)
            // User will remain unauthenticated until they navigate or refresh.
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const newToken = response?.token || response?.accessToken || response?.jwt;
      if (!newToken) {
        return { success: false, error: 'Login response missing token' };
      }

      const userData = response?.user || response;

      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      const { token: newToken, ...userInfo } = response;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userInfo);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};



