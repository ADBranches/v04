// app/components/admin/analytics-dashboard.tsx
import React from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-2xl transition-all duration-300">
      {icon && <div className="text-uganda-yellow text-3xl mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold text-uganda-black font-display">
        {title}
      </h3>
      <p className="text-3xl font-bold text-safari-forest">{value}</p>
    </div>
  );
}

interface AnalyticsDashboardProps {
  metrics: { title: string; value: string | number; icon?: React.ReactNode }[];
}

export default function AnalyticsDashboard({ metrics }: AnalyticsDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((m, i) => (
        <MetricCard key={i} {...m} />
      ))}
    </div>
  );
}
