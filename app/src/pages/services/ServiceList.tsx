import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serviceApi, ServiceStatus } from '@/services/serviceApi';
import { technicianApi } from '@/services/technicianApi';
import { serviceKeys, technicianKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import EditServiceModal from '@/components/services/EditServiceModal';
import { Plus, Search, Filter, Eye, Calendar, User, Smartphone, Clock, Package, CheckCircle, UserX, Truck, Activity, Edit2, Trash2, ChevronDown, X, Check, RefreshCw, XCircle, LayoutList } from 'lucide-react';

const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ServiceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ServiceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ServiceStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ServiceStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
  [ServiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [ServiceStatus.NOT_SERVICEABLE]: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.COMPLETED]: 'Completed',
  [ServiceStatus.DELIVERED]: 'Delivered',
  [ServiceStatus.CANCELLED]: 'Cancelled',
  [ServiceStatus.NOT_SERVICEABLE]: 'Not Serviceable',
};

export default function ServiceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // Initialize filters from URL params
  const initialStatus = searchParams.get('status') as ServiceStatus | '' || '';
  const initialUnassigned = searchParams.get('unassigned') === 'true';

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: initialStatus,
    startDate: '',
    endDate: '',
    unassigned: initialUnassigned,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [assigningServiceId, setAssigningServiceId] = useState<string | null>(null);
  const [technicianSearch, setTechnicianSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAssigningServiceId(null);
        setTechnicianSearch('');
      }
    };

    if (assigningServiceId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assigningServiceId]);

  // Fetch services
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['services', filters],
    queryFn: () => serviceApi.getAllServices({
      ...filters,
      status: filters.status || undefined,
      unassigned: filters.unassigned || undefined,
      includeStats: true,
    }),
  });

  // Fetch technicians (only when assigning) - uses consistent query keys
  const { data: techniciansData } = useQuery({
    queryKey: technicianKeys.forAssignment(user?.branchId || ''),
    queryFn: () =>
      technicianApi.getTechniciansForAssignment({
        branchId: user?.branchId!,
      }),
    enabled: !!assigningServiceId && !!user?.branchId,
    staleTime: 2 * 60 * 1000, // 2 minutes - technician data is relatively stable
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => serviceApi.deleteService(id),
    onSuccess: () => {
      toast.success('Service deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    },
  });

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: ({ serviceId, technicianId }: { serviceId: string; technicianId: string }) =>
      serviceApi.assignTechnician(serviceId, technicianId),
    onSuccess: () => {
      toast.success('Technician assigned successfully');
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setAssigningServiceId(null);
      setTechnicianSearch('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign technician');
    },
  });

  // Filter technicians by search
  const filteredTechnicians = techniciansData?.technicians?.filter((tech: any) =>
    tech.name.toLowerCase().includes(technicianSearch.toLowerCase()) ||
    (tech.email && tech.email.toLowerCase().includes(technicianSearch.toLowerCase()))
  ) || [];

  const handleDelete = (e: React.MouseEvent, id: string, ticketNumber: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete service ${ticketNumber}? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleAssignClick = (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    setAssigningServiceId(serviceId === assigningServiceId ? null : serviceId);
    setTechnicianSearch('');
  };

  const handleAssign = (e: React.MouseEvent, serviceId: string, technicianId: string) => {
    e.stopPropagation();
    assignMutation.mutate({ serviceId, technicianId });
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleStatusFilter = (status: ServiceStatus | '') => {
    setFilters({ ...filters, status, unassigned: false, page: 1 });
    // Update URL params
    const newParams = new URLSearchParams();
    if (status) newParams.set('status', status);
    setSearchParams(newParams);
  };

  // Handle card click for filtering
  const handleCardClick = (status: ServiceStatus | 'UNASSIGNED' | 'ALL') => {
    const newParams = new URLSearchParams();

    if (status === 'ALL') {
      // Clear all filters
      setFilters({ ...filters, status: '', unassigned: false, page: 1 });
    } else if (status === 'UNASSIGNED') {
      newParams.set('unassigned', 'true');
      setFilters({ ...filters, status: '', unassigned: true, page: 1 });
    } else {
      newParams.set('status', status);
      setFilters({ ...filters, status, unassigned: false, page: 1 });
    }

    setSearchParams(newParams);
  };

  // Check if any filter is active
  const hasActiveFilter = filters.status || filters.unassigned;

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
          onClick={() => navigate('/services/create')}
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
          {/* Total */}
          <div
            onClick={() => handleCardClick('ALL')}
            className={`bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              !filters.status && !filters.unassigned ? 'ring-4 ring-purple-300 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-100 uppercase tracking-wider font-semibold mb-1">Total</p>
                <p className="text-3xl font-bold text-white">{data.stats.total}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <LayoutList className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Unassigned */}
          <div
            onClick={() => handleCardClick('UNASSIGNED')}
            className={`bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              filters.unassigned ? 'ring-4 ring-gray-300 ring-offset-2' : ''
            }`}
          >
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

          {/* In Progress */}
          <div
            onClick={() => handleCardClick(ServiceStatus.IN_PROGRESS)}
            className={`bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              filters.status === ServiceStatus.IN_PROGRESS ? 'ring-4 ring-blue-300 ring-offset-2' : ''
            }`}
          >
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

          {/* Waiting Parts */}
          <div
            onClick={() => handleCardClick(ServiceStatus.WAITING_PARTS)}
            className={`bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              filters.status === ServiceStatus.WAITING_PARTS ? 'ring-4 ring-orange-300 ring-offset-2' : ''
            }`}
          >
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

          {/* Ready (Completed) */}
          <div
            onClick={() => handleCardClick(ServiceStatus.COMPLETED)}
            className={`bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              filters.status === ServiceStatus.COMPLETED ? 'ring-4 ring-green-300 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-100 uppercase tracking-wider font-semibold mb-1">Ready</p>
                <p className="text-3xl font-bold text-white">{data.stats.completed}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          {/* Not Ready (Not Serviceable) */}
          <div
            onClick={() => handleCardClick(ServiceStatus.NOT_SERVICEABLE)}
            className={`bg-gradient-to-br from-red-400 to-red-600 rounded-lg p-5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${
              filters.status === ServiceStatus.NOT_SERVICEABLE ? 'ring-4 ring-red-300 ring-offset-2' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-100 uppercase tracking-wider font-semibold mb-1">Not Ready</p>
                <p className="text-3xl font-bold text-white">{data.stats.notServiceable}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilter && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Filtering by: <span className="font-semibold">{filters.unassigned ? 'Unassigned' : STATUS_LABELS[filters.status as ServiceStatus]}</span>
          </span>
          <button
            onClick={() => handleCardClick('ALL')}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4" />
            Clear Filter
          </button>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.services.map((service) => (
                    <tr
                      key={service.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/services/${service.id}`)}
                    >
                      {/* Column 1: Service & Customer */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-900">
                              {service.ticketNumber}
                            </span>
                            {service.isRepeatedService && (
                              <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                                <RefreshCw className="w-3 h-3" />
                                Repeat
                              </span>
                            )}
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
                          {service.createdBy && (
                            <div className="text-xs text-gray-500">
                              Booked by: <span className="font-medium">{service.createdBy.name}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Column 2: Details */}
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          {/* Faults */}
                          {service.faults && service.faults.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {service.faults.slice(0, 3).map((f: any) => (
                                <span
                                  key={f.fault?.id || f.faultId}
                                  className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                                >
                                  {f.fault?.name || 'Unknown'}
                                </span>
                              ))}
                              {service.faults.length > 3 && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{service.faults.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No faults</span>
                          )}
                          {/* Estimated Price */}
                          <div className="text-sm text-gray-900">
                            <span className="text-xs text-gray-500">Est.</span> <span className="font-medium">₹{service.estimatedCost || 0}</span>
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
                            <div className="relative" ref={assigningServiceId === service.id ? dropdownRef : null}>
                              <button
                                onClick={(e) => handleAssignClick(e, service.id)}
                                className="flex items-center gap-2 text-gray-400 hover:text-purple-600 transition-colors"
                              >
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">Unassigned</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {/* Technician Dropdown */}
                              {assigningServiceId === service.id && (
                                <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                  {/* Search */}
                                  <div className="p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                      <input
                                        type="text"
                                        placeholder="Search technician..."
                                        value={technicianSearch}
                                        onChange={(e) => setTechnicianSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                      />
                                    </div>
                                  </div>

                                  {/* Technician List */}
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredTechnicians.length === 0 ? (
                                      <div className="p-3 text-center text-sm text-gray-500">
                                        No technicians found
                                      </div>
                                    ) : (
                                      filteredTechnicians.map((tech: any) => (
                                        <button
                                          key={tech.id}
                                          onClick={(e) => handleAssign(e, service.id, tech.id)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                          disabled={assignMutation.isPending}
                                          className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                                        >
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{tech.name}</div>
                                            <div className="text-xs text-gray-500">{tech.email}</div>
                                          </div>
                                          <Check className="w-4 h-4 text-gray-400" />
                                        </button>
                                      ))
                                    )}
                                  </div>

                                  {/* Close button */}
                                  <div className="p-2 border-t">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssigningServiceId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            {formatDate(service.createdAt)}
                          </div>
                        </div>
                      </td>

                      {/* Column 4: Actions */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {/* View */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/services/${service.id}`);
                            }}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingServiceId(service.id);
                            }}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit service"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDelete(e, service.id, service.ticketNumber)}
                            disabled={deleteMutation.isPending}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() => navigate(`/services/${service.id}`)}
                    >
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-900">
                        {service.ticketNumber}
                      </span>
                      {service.isRepeatedService && (
                        <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                          <RefreshCw className="w-3 h-3" />
                          Repeat
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
                      {STATUS_LABELS[service.status]}
                    </span>
                  </div>

                  <div
                    className="space-y-2 cursor-pointer"
                    onClick={() => navigate(`/services/${service.id}`)}
                  >
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

                    {/* Faults */}
                    {service.faults && service.faults.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {service.faults.slice(0, 3).map((f: any) => (
                          <span
                            key={f.fault?.id || f.faultId}
                            className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium"
                          >
                            {f.fault?.name || 'Unknown'}
                          </span>
                        ))}
                        {service.faults.length > 3 && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{service.faults.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">No faults</span>
                    )}

                    {/* Estimated Price */}
                    <div className="text-sm text-gray-900">
                      <span className="text-xs text-gray-500">Est.</span> <span className="font-medium">₹{service.estimatedCost || 0}</span>
                    </div>
                    {service.createdBy && (
                      <div className="text-xs text-gray-500">
                        Booked by: <span className="font-medium">{service.createdBy.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {service.assignedTo ? (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-600">{service.assignedTo.name}</span>
                        </>
                      ) : (
                        <div className="relative" ref={assigningServiceId === service.id ? dropdownRef : null}>
                          <button
                            onClick={(e) => handleAssignClick(e, service.id)}
                            className="flex items-center gap-1 text-gray-400 hover:text-purple-600 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span className="text-xs">Unassigned</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>

                          {/* Mobile Technician Dropdown */}
                          {assigningServiceId === service.id && (
                            <div className="absolute left-0 bottom-full mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                              <div className="p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <input
                                    type="text"
                                    placeholder="Search technician..."
                                    value={technicianSearch}
                                    onChange={(e) => setTechnicianSearch(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredTechnicians.length === 0 ? (
                                  <div className="p-3 text-center text-sm text-gray-500">
                                    No technicians found
                                  </div>
                                ) : (
                                  filteredTechnicians.map((tech: any) => (
                                    <button
                                      key={tech.id}
                                      onClick={(e) => handleAssign(e, service.id, tech.id)}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      disabled={assignMutation.isPending}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between disabled:opacity-50"
                                    >
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">{tech.name}</div>
                                        <div className="text-xs text-gray-500">{tech.email}</div>
                                      </div>
                                      <Check className="w-4 h-4 text-gray-400" />
                                    </button>
                                  ))
                                )}
                              </div>
                              <div className="p-2 border-t">
                                <button
                                  onClick={() => setAssigningServiceId(null)}
                                  className="w-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/services/${service.id}`)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingServiceId(service.id)}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, service.id, service.ticketNumber)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Edit Service Modal */}
      {editingServiceId && (
        <EditServiceModal
          isOpen={!!editingServiceId}
          onClose={() => setEditingServiceId(null)}
          serviceId={editingServiceId}
        />
      )}
    </div>
  );
}
