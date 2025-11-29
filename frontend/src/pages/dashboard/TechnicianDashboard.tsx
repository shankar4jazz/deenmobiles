import { useQuery } from '@tanstack/react-query';
import { Wrench, ClipboardCheck, Clock, Package } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';

export default function TechnicianDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['technicianDashboard'],
    queryFn: dashboardApi.getTechnicianDashboard,
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

  const { stats, assignedServices, completedServices, performanceStats } = data;

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_PARTS: '#8b5cf6',
    COMPLETED: '#10b981',
    DELIVERED: '#06b6d4',
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
        <p className="text-gray-600">Manage your assigned service requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Pending Tasks"
          value={performanceStats.pending}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          title="In Progress"
          value={performanceStats.inProgress}
          icon={Wrench}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Waiting for Parts"
          value={performanceStats.waitingParts}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Completed"
          value={performanceStats.completed}
          icon={ClipboardCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Active Service Requests</h2>
              <span className="text-sm text-gray-600">{assignedServices.length} tasks</span>
            </div>
            <div className="space-y-4">
              {assignedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active tasks assigned to you</p>
              ) : (
                assignedServices.map((service: any) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
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
                      <button className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                        Update Status
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Customer</p>
                        <p className="font-medium text-gray-900">{service.customer?.name}</p>
                        <p className="text-gray-600 text-xs">{service.customer?.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Device</p>
                        <p className="font-medium text-gray-900">{service.deviceModel || 'Not specified'}</p>
                      </div>
                    </div>

                    {service.issue && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-xs mb-1">Issue Description</p>
                        <p className="text-sm text-gray-700">{service.issue}</p>
                      </div>
                    )}

                    {service.partsUsed && service.partsUsed.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-xs mb-1">Parts Used</p>
                        <div className="flex flex-wrap gap-2">
                          {service.partsUsed.map((partUsed: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {partUsed.part?.name} (x{partUsed.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <button className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
                        View Details
                      </button>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Mark Complete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recently Completed */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recently Completed</h2>
              <ClipboardCheck className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {completedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No completed tasks yet</p>
              ) : (
                completedServices.map((service: any) => (
                  <div key={service.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{service.ticketNumber}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{service.customer?.name}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Performance Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Assigned</span>
                <span className="text-lg font-bold text-gray-900">{performanceStats.totalAssigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-lg font-bold text-green-600">{performanceStats.completed}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      performanceStats.totalAssigned > 0
                        ? (performanceStats.completed / performanceStats.totalAssigned) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {performanceStats.totalAssigned > 0
                  ? `${Math.round((performanceStats.completed / performanceStats.totalAssigned) * 100)}% completion rate`
                  : 'No tasks assigned yet'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
