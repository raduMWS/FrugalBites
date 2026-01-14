import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/api';

interface User {
  userId: string;
  email: string;
  merchantId: string;
  businessName: string;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = await SecureStore.getItemAsync('vendor_auth_token');
      const userData = await SecureStore.getItemAsync('vendor_user_data');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting login with:', email);
      const response = await authService.loginMerchant(email, password);
      console.log('Login response:', JSON.stringify(response, null, 2));
      await SecureStore.setItemAsync('vendor_auth_token', response.token);
      await SecureStore.setItemAsync('vendor_user_data', JSON.stringify(response.user));
      setUser(response.user);
      console.log('User set successfully');
    } catch (error: any) {
      console.error('Login error:', error.message);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('vendor_auth_token');
    await SecureStore.deleteItemAsync('vendor_user_data');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
