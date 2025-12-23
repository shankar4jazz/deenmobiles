import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, Clock, Users, Wrench, UserCog, RefreshCw } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';

export default function ManagerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['managerDashboard'],
    queryFn: dashboardApi.getManagerDashboard,
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

  const { stats, branch, employees, servicesByStatus, recentServices, charts, activity } = data;

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
      {/* Branch Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{branch?.name || 'Branch Dashboard'}</h1>
        <p className="text-gray-600">{branch?.company?.name || 'Company'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          change={stats.totalServicesChange}
          icon={BarChart3}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
        />
        <StatCard
          title="Branch Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          change={stats.revenueChange}
          icon={DollarSign}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-100"
        />
        <StatCard
          title="Pending Services"
          value={stats.pendingServices}
          change={stats.pendingServicesChange}
          icon={Clock}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          change={stats.completedTodayChange}
          icon={Wrench}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Repeated Services"
          value={stats.repeatedServices || 0}
          change={stats.repeatedServicesChange || 0}
          icon={RefreshCw}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Status Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-6">Service Status Distribution</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={servicesByStatus}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {servicesByStatus.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={statusColors[entry.name] || '#9ca3af'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-2">
                {servicesByStatus.map((status: any) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: statusColors[status.name] || '#9ca3af' }}
                      ></div>
                      <span className="text-sm text-gray-600">{status.name.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Service Requests */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Service Requests</h2>
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
                  {recentServices.slice(0, 5).map((service: any) => (
                    <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{service.ticketNumber}</td>
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
                      <td className="py-3 px-4 text-sm text-gray-600">{service.assignedTo?.name || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Branch Staff Management */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Branch Staff</h2>
              <a href="/employees/create" className="text-sm text-purple-600 hover:text-purple-700 font-medium">
                Add Employee
              </a>
            </div>
            <div className="space-y-4">
              {Object.entries(employees || {}).map(([role, empList]: [string, any]) => (
                <div key={role} className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    {role.replace('_', ' ')} ({empList.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {empList.slice(0, 4).map((emp: any) => (
                      <div key={emp.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-600">{emp.email}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {emp.activeServices} active
                        </span>
                      </div>
                    ))}
                  </div>
                  {empList.length > 4 && (
                    <p className="text-xs text-gray-500 mt-2">+ {empList.length - 4} more</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <ActivityFeed activities={activity} title="Recent Activity" />
        </div>
      </div>
    </DashboardLayout>
  );
}
