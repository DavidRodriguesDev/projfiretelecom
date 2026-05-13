import React, { useState, useEffect } from 'react';
import StatsCard from '../../components/ui/StatsCard';
import LineChart from '../../components/charts/LineChart';
import PieChart from '../../components/charts/PieChart';
import BarChart from '../../components/charts/BarChart';
import { getDashboardStats, getClientesPorStatus, getFinanceiroMensal, getCrescimentoClientes, getInadimplencia } from '../../services/dashboardService';

interface DashboardStats {
  totalClientes: number;
  clientesAtivos: number;
  clientesInadimplentes: number;
  clientesCancelados: number;
  boletosPendentes: number;
  boletosPagos: number;
  boletosVencidos: number;
  receitaPrevista: number;
  receitaRecebida: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    crescimento: [] as Array<{ mes: string; total: number }>,
    porPlano: [] as Array<{ plano: string; total: number }>,
    inadimplencia: [] as Array<{ mes: string; inadimplentes: number; cancelados: number }>,
  });

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const [estatisticas, clientesPorStatus, financeiro, crescimento, inadimplencia] = await Promise.all([
        getDashboardStats(),
        getClientesPorStatus(),
        getFinanceiroMensal(6),
        getCrescimentoClientes(6),
        getInadimplencia(6),
      ]);
      setStats(estatisticas);
      setChartData({
        crescimento,
        porPlano: clientesPorStatus.map((item: any) => ({ plano: item.status, total: item.total })),
        inadimplencia: inadimplencia,
      });
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const acoes = [
    { label: 'Ver Clientes', href: '/clientes' },
    { label: 'Ver Boletos', href: '/boletos' },
    { label: 'Ver Planos', href: '/planos' },
    { label: 'Gerar Boleto Avulso', href: '/boletos/novo' },
    { label: 'Novo Cliente', href: '/clientes/novo' },
    { label: 'Gerar Relatorio', href: '/relatorios' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="mt-1 text-sm text-gray-500">Visao geral da gestao de cobranca</p>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total de Clientes', value: stats?.totalClientes || 0, color: 'blue' },
            { label: 'Clientes Ativos', value: stats?.clientesAtivos || 0, color: 'green' },
            { label: 'Inadimplentes', value: stats?.clientesInadimplentes || 0, color: 'red' },
            { label: 'Boletos Pendentes', value: stats?.boletosPendentes || 0, color: 'yellow' },
            { label: 'Receita Prevista', value: 'R$ ' + (stats?.receitaPrevista || 0).toFixed(2), color: 'indigo' },
            { label: 'Receita Recebida', value: 'R$ ' + (stats?.receitaRecebida || 0).toFixed(2), color: 'emerald' },
            { label: 'Boletos Pagos', value: stats?.boletosPagos || 0, color: 'teal' },
            { label: 'Boletos Vencidos', value: stats?.boletosVencidos || 0, color: 'orange' },
          ].map((stat, index) => (
            <StatsCard key={index} label={stat.label} value={stat.value} color={stat.color as any} />
          ))}
        </div>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Crescimento de Clientes</h3>
            <LineChart dataPoints={chartData.crescimento} />
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuicao por Status</h3>
            <PieChart dataPoints={chartData.porPlano} />
          </div>
          <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Inadimplencia ao Longo do Tempo</h3>
            <BarChart key={chartData.inadimplencia.length} dataPoints={chartData.inadimplencia} />
          </div>
        </div>
        <div className="mt-8 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acoes Rapidas</h3>
            <div className="grid grid-cols-3 gap-3">
              {acoes.map((action, index) => (
                <a
                  key={index}
                  href={action.href}
                  className="flex items-center justify-center px-4 py-3 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {action.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}