import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

export default function StatCard({ title, value, change, icon: Icon, iconColor, iconBg }: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
          <p className="text-sm text-gray-500">{title}</p>
        </div>
        <div className={`${iconBg} p-3 rounded-xl flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600" />
        )}
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}
