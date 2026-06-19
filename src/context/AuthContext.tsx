import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, LoginCredentials } from '@/types/api.types';
import { authApi } from '@/services/api/auth.api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = localStorage.getItem('adminUser');
        const token = localStorage.getItem('accessToken');
        
        if (storedUser && token) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error('Error loading stored auth session', e);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('adminUser');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const { user: loggedUser, accessToken, refreshToken } = response;

      if (loggedUser.role !== 'ADMIN' && loggedUser.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied. Admin privileges required.');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('adminUser', JSON.stringify(loggedUser));
      setUser(loggedUser);
    } catch (error) {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminUser');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('refreshToken');
      if (token) {
        await authApi.logout(token);
      }
    } catch (e) {
      console.warn('Backend logout failed or offline', e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('adminUser');
      setUser(null);
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('adminUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
