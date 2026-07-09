import React, { createContext, useState, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { getAccessToken } from '../services/api';
import * as authService from '../services/authService';

type AuthContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getAccessToken()
      .then(token => setIsAuthenticated(token !== null))
      .finally(() => setIsLoading(false));

    const sub = DeviceEventEmitter.addListener('auth:expired', () => setIsAuthenticated(false));
    return () => sub.remove();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(async (email: string, password: string, passwordConfirm: string) => {
    await authService.register(email, password, passwordConfirm);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
  }, []);

  // Called by screens after the token interceptor clears tokens on failed refresh
  const signOut = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
