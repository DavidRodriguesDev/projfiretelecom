/**
 * frontend/src/pages/dashboard/components/StatsCard.tsx
 * Componente de card de estatísticas para o dashboard
 */

import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'indigo' | 'emerald' | 'teal' | 'orange';
  icon?: React.ReactNode;
}

export default function StatsCard({ label, value, color = 'blue', icon }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    teal: 'bg-teal-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <dt className="text-sm font-medium text-gray-500 truncate">{label}</dt>
        <dd className="mt-1 text-3xl font-semibold text-gray-900">
          {icon && <span className="mr-2">{icon}</span>}
          {value}
        </dd>
      </div>
    </div>
  );
}
