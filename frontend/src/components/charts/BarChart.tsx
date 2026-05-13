/**
 * frontend/src/components/charts/BarChart.tsx
 * Componente de gráfico de barras para inadimplência ao longo do tempo
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface BarChartProps {
  dataPoints?: Array<{ mes: string; inadimplentes: number; cancelados: number }>;
  title?: string;
}

export default function BarChart({ dataPoints = [], title = 'Inadimplência ao Longo do Tempo' }: BarChartProps) {
  console.log('BarChart dataPoints:', dataPoints);
  const labels = dataPoints.map((d) => new Date(d.mes).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }));
  const inadimplentes = dataPoints.map((d) => d.inadimplentes);
  const cancelados = dataPoints.map((d) => d.cancelados);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Inadimplentes',
        data: inadimplentes,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      },
      {
        label: 'Cancelados',
        data: cancelados,
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgb(107, 114, 128)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        color: '#1f2937',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e5e7eb',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
