import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Users, Clock, PackageCheck, AlertCircle } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { useState } from 'react';

export default function ReceptionistDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['receptionistDashboard'],
    queryFn: dashboardApi.getReceptionistDashboard,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 90 * 1000, // Refetch every 90 seconds
    refetchOnWindowFocus: true,
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

  const { stats, todayServices, openServices, recentCustomers, quickStats } = data;

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_PARTS: '#8b5cf6',
    COMPLETED: '#10b981',
  };

  // Filter services based on search
  const filteredServices = openServices.filter((service: any) =>
    service.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.customer?.phone?.includes(searchQuery) ||
    service.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Reception</h1>
          <p className="text-gray-600">Manage service requests and customer interactions</p>
        </div>
        <a
          href="/services/create"
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Service Request
        </a>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Pending Services"
          value={quickStats.pendingServices}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          title="In Progress"
          value={quickStats.inProgressServices}
          icon={AlertCircle}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Waiting for Parts"
          value={quickStats.waitingForParts}
          icon={PackageCheck}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Ready for Delivery"
          value={quickStats.readyForDelivery}
          icon={PackageCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Service Requests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Open Services */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Open Service Requests</h2>
              <span className="text-sm text-gray-600">{filteredServices.length} requests</span>
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ticket #, customer name, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Services Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ticket #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Phone</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No service requests found
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service: any) => (
                      <tr key={service.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">{service.ticketNumber}</td>
                        <td className="py-3 px-4 text-sm text-gray-900">{service.customer?.name || 'N/A'}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{service.customer?.phone || 'N/A'}</td>
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Today's Services */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Today's Services</h2>
              <span className="text-sm text-gray-600">{todayServices.length} services</span>
            </div>
            <div className="space-y-3">
              {todayServices.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No services created today</p>
              ) : (
                todayServices.slice(0, 5).map((service: any) => (
                  <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{service.ticketNumber}</p>
                      <p className="text-xs text-gray-600">{service.customer?.name}</p>
                    </div>
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
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recent Customers */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recent Customers</h2>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {recentCustomers.map((customer: any) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                    <p className="text-xs text-gray-600">{customer.phone}</p>
                  </div>
                  <span className="text-xs text-gray-500">{customer._count.services} services</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
