import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthContextType, AuthUser, SignUpRequest } from '../types/auth';
import { authService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Restore user session on app launch
  useEffect(() => {
    const restoreUser = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('authToken');
        const savedUser = await SecureStore.getItemAsync('authUser');
        
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.warn('Error restoring user session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.login({ email, password });
      setToken(response.token);
      setUser(response.user);

      // Save to secure storage
      await SecureStore.setItemAsync('authToken', response.token);
      await SecureStore.setItemAsync('authUser', JSON.stringify(response.user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignUpRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.signup(data);
      setToken(response.token);
      setUser(response.user);

      // Save to secure storage
      await SecureStore.setItemAsync('authToken', response.token);
      await SecureStore.setItemAsync('authUser', JSON.stringify(response.user));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setToken(null);

      // Clear secure storage
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('authUser');
    } catch (err) {
      console.warn('Error during logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isSignedIn: !!user,
    login,
    signup,
    logout,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
