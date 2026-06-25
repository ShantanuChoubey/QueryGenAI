import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // Set temporary authorization header for the verification request
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
          const response = await apiClient.get('/auth/me');
          
          if (response.data?.success && response.data?.user) {
            setUser(response.data.user);
            setToken(savedToken);
          } else {
            localStorage.removeItem('token');
            delete apiClient.defaults.headers.common['Authorization'];
          }
        } catch (error) {
          console.error('Failed to restore authentication session:', error);
          localStorage.removeItem('token');
          delete apiClient.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Perform user registration
  const register = async (email, password, fullName) => {
    const response = await apiClient.post('/auth/register', {
      email,
      password,
      fullName,
    });
    return response.data;
  };

  // Perform user login
  const login = async (email, password) => {
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    const { token: receivedToken, user: receivedUser } = response.data;
    
    localStorage.setItem('token', receivedToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${receivedToken}`;
    
    setUser(receivedUser);
    setToken(receivedToken);
    
    return response.data;
  };

  // Perform user logout
  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    token,
    isLoading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
