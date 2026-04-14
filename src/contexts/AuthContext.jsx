import React, { createContext, useContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../services/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) ?? null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? null);

  // Le rôle est extrait directement de l'objet user
  const role = user?.role ?? null;

  const login = useCallback(async (email, password) => {
    const response = await axiosInstance.post('auth/login', { email, password });
    const { success, token: jwt, refresh, user: userData, message: msg } = response.data;

    if (!success || !jwt) throw new Error(msg || 'Connexion échouée');

    localStorage.setItem('accessToken', jwt);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      if (refreshToken) {
        await axiosInstance.post('auth/logout/', { refresh: refreshToken });
      }
    } catch {
      // On vide quoi qu'il arrive
    } finally {
      localStorage.clear();
      setToken(null);
      setUser(null);
    }
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!token) return false;
    try {
      const { exp } = jwtDecode(token);
      return exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }, [token]);

  /**
   * Vérifie si le rôle courant est dans la liste fournie.
   * @param {string[]} roles - ex. ['Admin', 'Gerant']
   */
  const hasRole = useCallback(
    (roles) => {
      if (!role) return false;
      return roles.includes(role);
    },
    [role],
  );

  return (
    <AuthContext.Provider value={{ user, token, role, login, logout, isAuthenticated, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
