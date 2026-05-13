/**
 * frontend/src/components/charts/LineChart.tsx
 * Componente de gráfico de linha para crescimento de clientes
 */

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LineChartProps {
  dataPoints?: Array<{ mes: string; total: number }>;
  title?: string;
}

export default function LineChart({ dataPoints = [], title = 'Crescimento de Clientes' }: LineChartProps) {
  const labels = dataPoints.map((d) => d.mes);
  const dataValues = dataPoints.map((d) => d.total);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Novos Clientes',
        data: dataValues,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
      <Line data={chartData} options={options} />
    </div>
  );
}
