interface EmptyStateProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export default function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      {icon && <img src={icon} alt="" className="mx-auto mb-6 w-24 opacity-70" />}
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      <p className="text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}
