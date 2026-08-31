'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; initialUser?: User | null }> = ({
  children,
  initialUser,
}) => {
  const [user, setUser] = useState<User | null>(initialUser || null);
  const [loading, setLoading] = useState<boolean>(!initialUser);
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialUser) {
      fetchProfile();
    } else {
      setUser(initialUser);
      setLoading(false);
    }
  }, [initialUser]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
    }
    router.push('/');
  };

  const googleLogin = async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    if (res.data?.data?.user) {
      setUser(res.data.data.user);
    }
    router.push('/');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (['ADMIN', 'CO', 'GM', 'PRODUCTION_HEAD'].includes((user.role || '').toUpperCase())) return true;
    const permString = `${module}:${action}`;
    const manageString = `${module}:MANAGE`;
    return user.permissions?.includes(permString) || user.permissions?.includes(manageString) || false;
  };

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, logout, refreshProfile: fetchProfile, hasPermission, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
