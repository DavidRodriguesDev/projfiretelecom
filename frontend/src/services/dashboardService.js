/**
 * frontend/src/services/dashboardService.js - Serviço de dashboard para frontend
 */

import api from './api';

/**
 * Obter estatísticas do sistema
 */
export async function getDashboardStats() {
  const response = await api.get('/dashboard/estatisticas');
  return response.data;
}

/**
 * Obter clientes por status
 */
export async function getClientesPorStatus() {
  const response = await api.get('/dashboard/clientes-por-status');
  return response.data;
}

/**
 * Obter financeiro mensal
 */
export async function getFinanceiroMensal(meses = 12) {
  const response = await api.get(`/dashboard/financeiro-mensal?meses=${meses}`);
  return response.data;
}

/**
 * Obter crescimento de clientes
 */
export async function getCrescimentoClientes(meses = 6) {
  const response = await api.get(`/dashboard/crescimento-clientes?meses=${meses}`);
  return response.data;
}
