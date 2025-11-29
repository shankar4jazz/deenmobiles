import { useQuery } from '@tanstack/react-query';
import { serviceApi, ServiceStatus } from '@/services/serviceApi';
import { Clock, Circle, CheckCircle, AlertCircle, Package, UserCheck } from 'lucide-react';

interface ServiceHistoryTimelineProps {
  serviceId: string;
}

const STATUS_ICONS: Record<ServiceStatus, any> = {
  [ServiceStatus.PENDING]: Circle,
  [ServiceStatus.IN_PROGRESS]: Clock,
  [ServiceStatus.WAITING_PARTS]: Package,
  [ServiceStatus.COMPLETED]: CheckCircle,
  [ServiceStatus.DELIVERED]: CheckCircle,
  [ServiceStatus.CANCELLED]: AlertCircle,
};

const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'text-yellow-600 bg-yellow-100',
  [ServiceStatus.IN_PROGRESS]: 'text-blue-600 bg-blue-100',
  [ServiceStatus.WAITING_PARTS]: 'text-orange-600 bg-orange-100',
  [ServiceStatus.COMPLETED]: 'text-green-600 bg-green-100',
  [ServiceStatus.DELIVERED]: 'text-purple-600 bg-purple-100',
  [ServiceStatus.CANCELLED]: 'text-red-600 bg-red-100',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting for Parts',
  [ServiceStatus.COMPLETED]: 'Completed',
  [ServiceStatus.DELIVERED]: 'Delivered',
  [ServiceStatus.CANCELLED]: 'Cancelled',
};

export default function ServiceHistoryTimeline({ serviceId }: ServiceHistoryTimelineProps) {
  // Fetch service history
  const { data: history, isLoading } = useQuery({
    queryKey: ['service-history', serviceId],
    queryFn: () => serviceApi.getStatusHistory(serviceId),
    enabled: !!serviceId,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
        </div>
        <div className="text-center py-8">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No history available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock className="h-5 w-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Service History</h3>
        <span className="ml-auto text-sm text-gray-500">{history.length} events</span>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline Items */}
        <div className="space-y-6">
          {history.map((item, index) => {
            const IconComponent = STATUS_ICONS[item.status];
            const colorClasses = STATUS_COLORS[item.status];
            const { date, time } = formatDate(item.createdAt);
            const isLatest = index === 0;

            return (
              <div key={item.id} className="relative pl-12">
                {/* Timeline Dot */}
                <div
                  className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center ${colorClasses} ${
                    isLatest ? 'ring-4 ring-offset-2 ring-purple-200' : ''
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className={`pb-6 ${isLatest ? 'bg-purple-50' : 'bg-gray-50'} border ${
                  isLatest ? 'border-purple-200' : 'border-gray-200'
                } rounded-lg p-4`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        {STATUS_LABELS[item.status]}
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-semibold rounded-full">
                            CURRENT
                          </span>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {time}
                        </span>
                        <span>•</span>
                        <span>{date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Changed By */}
                  {(item.changedByUser || item.changedBy) && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                      <UserCheck className="h-4 w-4" />
                      <span>Changed by: {item.changedByUser?.name || item.changedBy || 'Unknown'}</span>
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{item.notes}"</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
