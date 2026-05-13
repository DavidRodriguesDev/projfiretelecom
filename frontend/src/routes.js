/**
 * frontend/src/routes.js - Configuração de rotas
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

// Guard de rota protegida
export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
