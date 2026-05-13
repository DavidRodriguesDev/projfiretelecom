/**
 * frontend/src/routes/index.ts - Rotas protegidas do frontend
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

/**
 * Guard de rota protegida
 * Verifica se usuário está autenticado antes de acessar rotas
 */
export function ProtectedRoute() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
