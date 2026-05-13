/**
 * frontend/src/components/charts/PieChart.tsx
 * Componente de gráfico depizza para distribuição por plano
 */

import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartProps {
  dataPoints?: Array<{ plano: string; total: number }>;
  title?: string;
}

export default function PieChart({ dataPoints = [], title = 'Distribuição por Plano' }: PieChartProps) {
  const labels = dataPoints.map((d) => d.plano);
  const dataValues = dataPoints.map((d) => d.total);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Clientes',
        data: dataValues,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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
  };

  return (
    <div className="h-64 w-full flex justify-center items-center">
      <Pie data={chartData} options={options} />
    </div>
  );
}
