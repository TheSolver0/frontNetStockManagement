// src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

const isTokenValid = (token) => {
    try {
      const { exp } = jwtDecode(token);
      return exp * 1000 > Date.now(); // token encore valide
    } catch {
      return false;
    }
  };

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken");

  if (!token || !isTokenValid(token)) {
    return <Navigate to="/login" replace />;
  }

  // Si connecté, afficher la page demandée
  return children;
};

export default PrivateRoute;
