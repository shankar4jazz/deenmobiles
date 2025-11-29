import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Users, ClipboardCheck, ArrowRight } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';

export default function TechnicianManagerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['technicianManagerDashboard'],
    queryFn: dashboardApi.getTechnicianManagerDashboard,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { stats, unassignedServices, technicians, allServices, statusDistribution } = data;

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_PARTS: '#8b5cf6',
    COMPLETED: '#10b981',
    DELIVERED: '#06b6d4',
    CANCELLED: '#ef4444',
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Technician Management</h1>
        <p className="text-gray-600">Assign and track service requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Unassigned Services"
          value={unassignedServices.length}
          icon={AlertCircle}
          iconColor="text-red-600"
          iconBg="bg-red-100"
        />
        <StatCard
          title="Active Technicians"
          value={technicians.length}
          icon={Users}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Pending Services"
          value={stats.pendingServices}
          icon={ClipboardCheck}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          icon={ClipboardCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Unassigned Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Unassigned Services */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Unassigned Service Requests</h2>
              <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                {unassignedServices.length} requests
              </span>
            </div>
            <div className="space-y-3">
              {unassignedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">All services are assigned!</p>
              ) : (
                unassignedServices.map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{service.ticketNumber}</span>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${statusColors[service.status] || '#9ca3af'}20`,
                            color: statusColors[service.status] || '#9ca3af',
                          }}
                        >
                          {service.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{service.customer?.name}</p>
                      <p className="text-xs text-gray-500">{service.customer?.phone}</p>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                      Assign
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* All Services Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">All Service Requests</h2>
              <a href="/services" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                View All
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ticket #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assigned To</th>
                  </tr>
                </thead>
                <tbody>
                  {allServices.slice(0, 10).map((service: any) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{service.ticketNumber}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{service.customer?.name || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${statusColors[service.status] || '#9ca3af'}20`,
                            color: statusColors[service.status] || '#9ca3af',
                          }}
                        >
                          {service.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {service.assignedTo?.name || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Technician Workload */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Technician Workload</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {technicians.map((tech: any) => (
                <div key={tech.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{tech.name}</p>
                      <p className="text-xs text-gray-600">{tech.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        tech.activeTasksCount === 0
                          ? 'bg-green-100 text-green-700'
                          : tech.activeTasksCount < 3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {tech.activeTasksCount} active
                    </span>
                  </div>
                  {tech.activeTasks.length > 0 && (
                    <div className="space-y-2">
                      {tech.activeTasks.slice(0, 3).map((task: any) => (
                        <div key={task.id} className="text-xs p-2 bg-gray-50 rounded">
                          <p className="font-medium text-gray-900">{task.ticketNumber}</p>
                          <p className="text-gray-600">{task.customer?.name}</p>
                        </div>
                      ))}
                      {tech.activeTasks.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          + {tech.activeTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Status Distribution</h2>
            <div className="space-y-3">
              {statusDistribution.map((status: any) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: statusColors[status.name] || '#9ca3af' }}
                    ></div>
                    <span className="text-sm text-gray-700">{status.name.replace('_', ' ')}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
