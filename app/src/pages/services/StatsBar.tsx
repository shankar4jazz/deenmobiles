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
  completed: number;
  delivered: number;
  cancelled: number;
  notServiceable: number;
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
    color: 'text-purple-500',
    getValue: (stats: ServiceStats) => stats.total
  },
  {
    key: 'UNASSIGNED',
    label: 'Unassigned',
    icon: UserX,
    color: 'text-gray-500',
    getValue: (stats: ServiceStats) => stats.unassigned
  },
  {
    key: ServiceStatus.IN_PROGRESS,
    label: 'In Progress',
    icon: Activity,
    color: 'text-blue-500',
    getValue: (stats: ServiceStats) => stats.inProgress
  },
  {
    key: ServiceStatus.WAITING_PARTS,
    label: 'Waiting',
    icon: Package,
    color: 'text-orange-500',
    getValue: (stats: ServiceStats) => stats.waitingParts
  },
  {
    key: ServiceStatus.COMPLETED,
    label: 'Ready',
    icon: CheckCircle,
    color: 'text-green-500',
    getValue: (stats: ServiceStats) => stats.completed
  },
  {
    key: ServiceStatus.NOT_SERVICEABLE,
    label: 'Not Ready',
    icon: XCircle,
    color: 'text-red-500',
    getValue: (stats: ServiceStats) => stats.notServiceable
  },
  {
    key: 'REPEATED',
    label: 'Repeated',
    icon: RefreshCw,
    color: 'text-pink-500',
    getValue: (stats: ServiceStats) => stats.repeatedService
  },
  {
    key: ServiceStatus.DELIVERED,
    label: 'Delivered',
    icon: Truck,
    color: 'text-teal-500',
    getValue: (stats: ServiceStats) => stats.delivered
  },
  {
    key: 'UNDELIVERED',
    label: 'Undelivered',
    icon: Clock,
    color: 'text-amber-500',
    getValue: (stats: ServiceStats) => stats.completed // Ready but not delivered
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
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin scrollbar-thumb-gray-300">
      {statCards.map((card) => {
        const Icon = card.icon;
        const active = isActive(card.key);
        const value = card.getValue(stats);

        return (
          <button
            key={card.key}
            onClick={() => onFilterClick(card.key as any)}
            className={`flex-shrink-0 min-w-[80px] px-3 py-2 bg-white border rounded-lg text-center cursor-pointer transition-all ${
              active
                ? 'ring-2 ring-purple-500 bg-purple-50 border-purple-300'
                : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <Icon className={`w-4 h-4 mx-auto mb-1 ${card.color}`} />
            <div className="text-xs text-gray-500 mb-0.5">{card.label}</div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
          </button>
        );
      })}
    </div>
  );
}
