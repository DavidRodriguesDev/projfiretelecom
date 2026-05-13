import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Clientes from './pages/clientes/Clientes';
import EditCliente from './pages/clientes/EditCliente';
import NewCliente from './pages/clientes/NewCliente';
import BoletoList from './pages/boletos/BoletoList';
import NewBoleto from './pages/boletos/NewBoleto';
import Planos from './pages/planos/Planos';
import Relatorios from './pages/relatorios/Relatorios';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/clientes/novo" element={<ProtectedRoute><NewCliente /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><EditCliente /></ProtectedRoute>} />
        <Route path="/boletos" element={<ProtectedRoute><BoletoList /></ProtectedRoute>} />
        <Route path="/boletos/novo" element={<ProtectedRoute><NewBoleto /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/planos" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
