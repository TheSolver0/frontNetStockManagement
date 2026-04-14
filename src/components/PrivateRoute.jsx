import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * <PrivateRoute>           → protège une route (auth requise)
 * <PrivateRoute roles={['Admin','Gerant']}> → protège + vérifie le rôle
 *
 * Redirections :
 *  - Non authentifié  → /login
 *  - Rôle non autorisé → /unauthorized
 */
const PrivateRoute = ({ children, roles }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivateRoute;
