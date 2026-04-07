import React from 'react';
import { Navigate } from 'react-router-dom';
// import jwtDecode from 'jwt-decode';
import { jwtDecode } from 'jwt-decode';

const isTokenValid = (token) => {
  try {
    const { exp } = jwtDecode(token);
    return exp * 1000 > Date.now(); // token encore valide
  } catch {
    return false;
  }
};

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  const isAuthenticated = token && isTokenValid(token);

  if (!isAuthenticated) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
