import {
  LayoutList,
  UserX,
  Activity,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Truck,
  Clock
} from 'lucide-react';
import { ServiceStatus } from '@/services/serviceApi';

interface ServiceStats {
  total: number;
  pending: number;
  inProgress: number;
  waitingParts: number;
  ready: number;
  notReady: number;
  delivered: number;
  undelivered: number;
  unassigned: number;
  repeatedService: number;
}

interface StatsBarProps {
  stats: ServiceStats;
  activeFilter: {
    status?: ServiceStatus | '';
    unassigned?: boolean;
    undelivered?: boolean;
    completedAll?: boolean;
    repeatedService?: boolean;
  };
  onFilterClick: (filter: ServiceStatus | 'UNASSIGNED' | 'UNDELIVERED' | 'COMPLETED_ALL' | 'REPEATED' | 'ALL') => void;
}

const statCards = [
  {
    key: 'ALL',
    label: 'All',
    icon: LayoutList,
    gradient: 'from-purple-500 to-indigo-600',
    getValue: (stats: ServiceStats) => stats.total
  },
  {
    key: 'UNASSIGNED',
    label: 'Unassigned',
    icon: UserX,
    gradient: 'from-gray-400 to-gray-600',
    getValue: (stats: ServiceStats) => stats.unassigned
  },
  {
    key: ServiceStatus.IN_PROGRESS,
    label: 'In Progress',
    icon: Activity,
    gradient: 'from-blue-400 to-blue-600',
    getValue: (stats: ServiceStats) => stats.inProgress
  },
  {
    key: ServiceStatus.WAITING_PARTS,
    label: 'Waiting',
    icon: Package,
    gradient: 'from-orange-400 to-orange-600',
    getValue: (stats: ServiceStats) => stats.waitingParts
  },
  {
    key: ServiceStatus.READY,
    label: 'Ready',
    icon: CheckCircle,
    gradient: 'from-green-400 to-green-600',
    getValue: (stats: ServiceStats) => stats.ready
  },
  {
    key: ServiceStatus.NOT_READY,
    label: 'Not Ready',
    icon: XCircle,
    gradient: 'from-red-400 to-red-600',
    getValue: (stats: ServiceStats) => stats.notReady
  },
  {
    key: 'REPEATED',
    label: 'Repeated',
    icon: RefreshCw,
    gradient: 'from-pink-400 to-rose-600',
    getValue: (stats: ServiceStats) => stats.repeatedService
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: Truck,
    gradient: 'from-teal-400 to-teal-600',
    getValue: (stats: ServiceStats) => stats.delivered
  },
  {
    key: 'UNDELIVERED',
    label: 'Undelivered',
    icon: Clock,
    gradient: 'from-amber-400 to-amber-600',
    getValue: (stats: ServiceStats) => stats.undelivered
  },
];

export default function StatsBar({ stats, activeFilter, onFilterClick }: StatsBarProps) {
  const isActive = (key: string) => {
    if (key === 'ALL') {
      return !activeFilter.status && !activeFilter.unassigned && !activeFilter.undelivered && !activeFilter.completedAll && !activeFilter.repeatedService;
    }
    if (key === 'UNASSIGNED') return activeFilter.unassigned;
    if (key === 'UNDELIVERED') return activeFilter.undelivered;
    if (key === 'REPEATED') return activeFilter.repeatedService;
    return activeFilter.status === key;
  };

  return (
    <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 mb-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        const active = isActive(card.key);
        const value = card.getValue(stats);

        return (
          <button
            key={card.key}
            onClick={() => onFilterClick(card.key as any)}
            className={`bg-gradient-to-br ${card.gradient} rounded-lg p-3 text-center cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              active ? 'ring-2 ring-white ring-offset-2' : ''
            }`}
          >
            <Icon className="w-5 h-5 mx-auto mb-1 text-white" />
            <div className="text-xs text-white/80 mb-0.5">{card.label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
          </button>
        );
      })}
    </div>
  );
}
