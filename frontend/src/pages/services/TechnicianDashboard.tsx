import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { serviceApi, ServiceStatus } from '@/services/serviceApi';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Calendar,
  Smartphone,
  User,
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';

const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ServiceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ServiceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ServiceStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ServiceStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
  [ServiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.COMPLETED]: 'Completed',
  [ServiceStatus.DELIVERED]: 'Delivered',
  [ServiceStatus.CANCELLED]: 'Cancelled',
};

export default function TechnicianDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'ALL'>('ALL');

  // Fetch all assigned services
  const { data, isLoading } = useQuery({
    queryKey: ['technician-services', user?.id],
    queryFn: () => serviceApi.getAllServices({
      assignedToId: user?.id,
      limit: 100,
    }),
    enabled: !!user?.id,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!data?.services) return {
      totalAssigned: 0,
      todayAssigned: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      completedToday: 0,
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      totalAssigned: data.services.length,
      todayAssigned: data.services.filter(s => {
        const createdDate = new Date(s.createdAt);
        createdDate.setHours(0, 0, 0, 0);
        return createdDate.getTime() === today.getTime();
      }).length,
      pending: data.services.filter(s => s.status === ServiceStatus.PENDING).length,
      inProgress: data.services.filter(s => s.status === ServiceStatus.IN_PROGRESS).length,
      completed: data.services.filter(s =>
        s.status === ServiceStatus.COMPLETED || s.status === ServiceStatus.DELIVERED
      ).length,
      completedToday: data.services.filter(s => {
        if (s.status !== ServiceStatus.COMPLETED && s.status !== ServiceStatus.DELIVERED) return false;
        const completedDate = s.completedAt ? new Date(s.completedAt) : null;
        if (!completedDate) return false;
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      }).length,
    };
  }, [data]);

  // Filter services
  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    if (statusFilter === 'ALL') return data.services;
    return data.services.filter(s => s.status === statusFilter);
  }, [data, statusFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPriorityColor = (service: any) => {
    const createdDate = new Date(service.createdAt);
    const hoursDiff = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);

    if (service.status === ServiceStatus.COMPLETED || service.status === ServiceStatus.DELIVERED) {
      return 'border-l-green-500';
    }
    if (hoursDiff > 48) return 'border-l-red-500';
    if (hoursDiff > 24) return 'border-l-orange-500';
    return 'border-l-blue-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's your service queue for today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assigned */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Wrench className="h-6 w-6 text-purple-600" />
            </div>
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Assigned</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalAssigned}</p>
          <p className="text-xs text-gray-500 mt-1">All services</p>
        </div>

        {/* Today's Assigned */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Today's Assigned</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.todayAssigned}</p>
          <p className="text-xs text-gray-500 mt-1">New today</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setStatusFilter(ServiceStatus.PENDING)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <Clock className="h-5 w-5 text-orange-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Pending</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.pending + stats.inProgress}</p>
          <p className="text-xs text-orange-600 mt-1">Needs attention</p>
        </div>

        {/* Completed Today */}
        <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
             onClick={() => setStatusFilter(ServiceStatus.COMPLETED)}>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Completed Today</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
          <p className="text-xs text-green-600 mt-1">Great work!</p>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">My Services</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'ALL')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="ALL">All Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredServices.length === 0 ? (
            <div className="p-12 text-center">
              <Wrench className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No services found</p>
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => navigate(`/branch/services/${service.id}`)}
                className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${getPriorityColor(service)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-gray-900">
                        {service.ticketNumber}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
                        {STATUS_LABELS[service.status]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Customer</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{service.customer?.name}</p>
                        <p className="text-xs text-gray-500">{service.customer?.phone}</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Smartphone className="h-4 w-4" />
                          <span className="font-medium">Device</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">{service.deviceModel}</p>
                        {service.deviceIMEI && (
                          <p className="text-xs text-gray-500">IMEI: {service.deviceIMEI}</p>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-medium">Issue</span>
                        </div>
                        <p className="text-sm text-gray-900 line-clamp-2">{service.issue}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                      <span>Created: {formatDate(service.createdAt)}</span>
                      {service.completedAt && (
                        <span>Completed: {formatDate(service.completedAt)}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-sm font-medium text-gray-600">Estimated Cost</p>
                    <p className="text-xl font-bold text-purple-600">
                      ₹{service.estimatedCost.toLocaleString()}
                    </p>
                    {service.actualCost && service.actualCost > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Actual: ₹{service.actualCost.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
