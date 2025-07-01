'use client';

import React, { createContext, useState, useEffect, useCallback, useContext, type PropsWithChildren } from 'react';

const AUTH_KEY = 'qsmartpay_auth';

interface AuthState {
  isAuthenticated: boolean;
  user: { name: string } | null;
}

interface AuthContextType extends AuthState {
  isLoading: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [auth, setAuth] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_KEY);
      if (storedAuth) {
        setAuth(JSON.parse(storedAuth));
      }
    } catch (error) {
        console.error("Failed to parse auth state from localStorage", error);
        localStorage.removeItem(AUTH_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string) => {
    const newAuthState = { isAuthenticated: true, user: { name: username } };
    localStorage.setItem(AUTH_KEY, JSON.stringify(newAuthState));
    setAuth(newAuthState);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setAuth({ isAuthenticated: false, user: null });
  }, []);

  return React.createElement(
    AuthContext.Provider,
    { value: { ...auth, isLoading, login, logout } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
