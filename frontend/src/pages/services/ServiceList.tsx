import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { serviceApi, ServiceStatus } from '@/services/serviceApi';
import { Plus, Search, Filter, Eye, Calendar, User, Smartphone, Clock, Package, CheckCircle, UserX, Truck, Activity } from 'lucide-react';

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

export default function ServiceList() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '' as ServiceStatus | '',
    startDate: '',
    endDate: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch services
  const { data, isLoading } = useQuery({
    queryKey: ['services', filters],
    queryFn: () => serviceApi.getAllServices({
      ...filters,
      status: filters.status || undefined,
      includeStats: true,
    }),
  });

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilter = (status: ServiceStatus | '') => {
    setFilters({ ...filters, status, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all service requests</p>
        </div>
        <button
          onClick={() => navigate('/branch/services/create')}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Service
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by ticket number, customer name, phone, device..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleStatusFilter(e.target.value as ServiceStatus | '')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* Advanced Filters Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
      </div>

      {/* Analytics Cards */}
      {data?.stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {/* Pending */}
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-100 uppercase tracking-wider font-semibold mb-1">Pending</p>
                <p className="text-3xl font-bold text-white">{data.stats.pending}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Waiting Parts */}
          <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-100 uppercase tracking-wider font-semibold mb-1">Waiting Parts</p>
                <p className="text-3xl font-bold text-white">{data.stats.waitingParts}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* In Progress */}
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-100 uppercase tracking-wider font-semibold mb-1">In Progress</p>
                <p className="text-3xl font-bold text-white">{data.stats.inProgress}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-100 uppercase tracking-wider font-semibold mb-1">Completed</p>
                <p className="text-3xl font-bold text-white">{data.stats.completed}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Delivered */}
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-100 uppercase tracking-wider font-semibold mb-1">Delivered</p>
                <p className="text-3xl font-bold text-white">{data.stats.delivered}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <Truck className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Unassigned */}
          <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-100 uppercase tracking-wider font-semibold mb-1">Unassigned</p>
                <p className="text-3xl font-bold text-white">{data.stats.unassigned}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <UserX className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 mt-2">Loading services...</p>
          </div>
        ) : !data || data.services.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No services found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service & Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assignment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.services.map((service) => (
                    <tr
                      key={service.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/branch/services/${service.id}`)}
                    >
                      {/* Column 1: Service & Customer */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">
                              {service.ticketNumber}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {service.customer?.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {service.customer?.phone}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Smartphone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-600">{service.deviceModel}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Details */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-900 line-clamp-2">
                            {service.issue}
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
                            {STATUS_LABELS[service.status]}
                          </span>
                        </div>
                      </td>

                      {/* Column 3: Assignment */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {service.assignedTo ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-900">{service.assignedTo.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
                              <span className="text-sm text-gray-400">Unassigned</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {formatDate(service.createdAt)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {data.services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => navigate(`/branch/services/${service.id}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {service.ticketNumber}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
                      {STATUS_LABELS[service.status]}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.customer?.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {service.customer?.phone}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{service.deviceModel}</span>
                    </div>

                    <div className="text-sm text-gray-900 line-clamp-2">
                      {service.issue}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {service.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{service.assignedTo.name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-300" />
                          <span className="text-xs text-gray-400">Unassigned</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-500">
                        {formatDate(service.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((data.pagination.page - 1) * data.pagination.limit) + 1} to{' '}
                  {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} of{' '}
                  {data.pagination.total} services
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(data.pagination.page - 1)}
                    disabled={data.pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(data.pagination.page + 1)}
                    disabled={data.pagination.page === data.pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
