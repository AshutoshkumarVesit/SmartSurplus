'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken, setUser as storeUser, getUser } from './api';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'provider' | 'ngo' | 'admin';
  name: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getUser();
    if (stored) {
      setUserState(stored);
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    const tokenData = await api.login({ username, password });
    setToken(tokenData.access_token);

    // Decode JWT to get user info (basic decode)
    const segment = tokenData.access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(segment.padEnd(Math.ceil(segment.length / 4) * 4, '=')), char => char.charCodeAt(0))));

    // We need basic user info - let's store what we have
    const userInfo: User = {
      id: payload.sub,
      username: payload.sub,
      email: '',
      role: payload.role,
      name: payload.sub,
    };
    storeUser(userInfo);
    setUserState(userInfo);
    return userInfo;
  };

  const register = async (data: any): Promise<User> => {
    const newUser = await api.register(data);
    // After registering, auto-login
    return await login(data.username, data.password);
  };

  const logout = () => {
    clearToken();
    setUserState(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
