import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { serviceApi, ServiceStatus, DeliveryStatus } from '@/services/serviceApi';
import { technicianApi } from '@/services/technicianApi';
import { masterDataApi } from '@/services/masterDataApi';
import { technicianKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import EditServiceModal from '@/components/services/EditServiceModal';
import DeliveryModal from '@/components/services/DeliveryModal';
import ServiceTable from './ServiceTable';
import StatsBar from './StatsBar';
import TableFilters from './TableFilters';
import { Plus, Eye, Calendar, User, Smartphone, Search, Edit2, Trash2, ChevronDown, X, Check, RefreshCw, LayoutGrid, Table2, MoreVertical, Download, FileText, Tag } from 'lucide-react';
import { invoiceApi } from '@/services/invoiceApi';
import { jobSheetApi } from '@/services/jobSheetApi';

const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ServiceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ServiceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ServiceStatus.READY]: 'bg-green-100 text-green-800',
  [ServiceStatus.NOT_READY]: 'bg-gray-100 text-gray-800',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.READY]: 'Ready',
  [ServiceStatus.NOT_READY]: 'Not Ready',
};

export default function ServiceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  // Initialize filters from URL params
  const initialStatus = searchParams.get('status') as ServiceStatus | '' || '';
  const initialUnassigned = searchParams.get('unassigned') === 'true';
  const initialUndelivered = searchParams.get('undelivered') === 'true';
  const initialCompletedAll = searchParams.get('completedAll') === 'true';
  const initialRepeatedService = searchParams.get('repeatedService') === 'true';

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: initialStatus,
    startDate: '',
    endDate: '',
    unassigned: initialUnassigned,
    undelivered: initialUndelivered,
    completedAll: initialCompletedAll,
    repeatedService: initialRepeatedService,
    faultIds: [] as string[],
  });

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [assigningServiceId, setAssigningServiceId] = useState<string | null>(null);
  const [technicianSearch, setTechnicianSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);

  // Auto-open delivery modal if URL has delivery=true
  useEffect(() => {
    if (searchParams.get('delivery') === 'true') {
      setShowDeliveryModal(true);
      // Remove the param from URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('delivery');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAssigningServiceId(null);
        setTechnicianSearch('');
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuId(null);
      }
    };

    if (assigningServiceId || actionMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [assigningServiceId, actionMenuId]);

  // Fetch faults for filter dropdown
  const { data: faultsData } = useQuery({
    queryKey: ['faults-list'],
    queryFn: () => masterDataApi.faults.getAll({ limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch services
  const { data, isLoading } = useQuery({
    queryKey: ['services', filters],
    queryFn: () => serviceApi.getAllServices({
      ...filters,
      status: filters.status || undefined,
      unassigned: filters.unassigned || undefined,
      undelivered: filters.undelivered || undefined,
      completedAll: filters.completedAll || undefined,
      repeatedService: filters.repeatedService || undefined,
      faultIds: filters.faultIds.length > 0 ? filters.faultIds : undefined,
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
    staleTime: 2 * 60 * 1000,
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

  const handleDownloadInvoice = async (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    try {
      const response = await invoiceApi.downloadPDF(invoiceId, 'A4');
      if (response.pdfUrl) {
        window.open(response.pdfUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleDownloadJobsheet = async (e: React.MouseEvent, serviceId: string, jobSheetId?: string) => {
    e.stopPropagation();
    try {
      if (jobSheetId) {
        // Jobsheet exists, download directly
        const response = await jobSheetApi.downloadPDF(jobSheetId);
        if (response.pdfUrl) {
          window.open(response.pdfUrl, '_blank');
        }
      } else {
        // Jobsheet doesn't exist, generate first
        const jobSheet = await jobSheetApi.generateFromService(serviceId);
        if (jobSheet.pdfUrl) {
          window.open(jobSheet.pdfUrl, '_blank');
        }
        // Refresh the services list to update the jobsheet data
        queryClient.invalidateQueries({ queryKey: ['services'] });
      }
    } catch (error) {
      toast.error('Failed to download jobsheet');
    }
  };

  const handlePrintLabel = async (e: React.MouseEvent, serviceId: string) => {
    e.stopPropagation();
    try {
      const response = await serviceApi.downloadLabel(serviceId);
      if (response.pdfUrl) {
        // Open PDF in new window and trigger print
        const printWindow = window.open(response.pdfUrl, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
        }
      }
    } catch (error) {
      toast.error('Failed to generate label');
    }
  };

  // Handle card click for filtering
  const handleCardClick = (status: ServiceStatus | 'UNASSIGNED' | 'UNDELIVERED' | 'COMPLETED_ALL' | 'REPEATED' | 'ALL') => {
    const newParams = new URLSearchParams();

    if (status === 'ALL') {
      setFilters({ ...filters, status: '', unassigned: false, undelivered: false, completedAll: false, repeatedService: false, page: 1 });
    } else if (status === 'UNASSIGNED') {
      newParams.set('unassigned', 'true');
      setFilters({ ...filters, status: '', unassigned: true, undelivered: false, completedAll: false, repeatedService: false, page: 1 });
    } else if (status === 'UNDELIVERED') {
      newParams.set('undelivered', 'true');
      setFilters({ ...filters, status: '', unassigned: false, undelivered: true, completedAll: false, repeatedService: false, page: 1 });
    } else if (status === 'COMPLETED_ALL') {
      newParams.set('completedAll', 'true');
      setFilters({ ...filters, status: '', unassigned: false, undelivered: false, completedAll: true, repeatedService: false, page: 1 });
    } else if (status === 'REPEATED') {
      newParams.set('repeatedService', 'true');
      setFilters({ ...filters, status: '', unassigned: false, undelivered: false, completedAll: false, repeatedService: true, page: 1 });
    } else {
      newParams.set('status', status);
      setFilters({ ...filters, status, unassigned: false, undelivered: false, completedAll: false, repeatedService: false, page: 1 });
    }

    setSearchParams(newParams);
  };

  // Check if any filter is active
  const hasActiveFilter = filters.status || filters.unassigned || filters.undelivered || filters.completedAll || filters.repeatedService || filters.faultIds.length > 0 || filters.startDate || filters.endDate || filters.search;

  // Handle filters change from TableFilters
  const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      ...filters,
      search: '',
      status: '',
      startDate: '',
      endDate: '',
      unassigned: false,
      undelivered: false,
      completedAll: false,
      repeatedService: false,
      faultIds: [],
      page: 1,
    });
    setSearchParams(new URLSearchParams());
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all service requests</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg p-1 bg-gray-50">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'card'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
                }`}
              title="Table View"
            >
              <Table2 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => navigate('/services/create')}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 hover:scale-105 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            New Service
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {data?.stats && (
        <StatsBar
          stats={data.stats}
          activeFilter={{
            status: filters.status,
            unassigned: filters.unassigned,
            undelivered: filters.undelivered,
            completedAll: filters.completedAll,
            repeatedService: filters.repeatedService,
          }}
          onFilterClick={handleCardClick}
        />
      )}

      {/* Services Content */}
      {viewMode === 'table' ? (
        <ServiceTable
          services={data?.services || []}
          isLoading={isLoading}
          pagination={data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 }}
          onPageChange={handlePageChange}
          toolbarContent={
            <TableFilters
              filters={{
                search: filters.search,
                status: filters.status,
                startDate: filters.startDate,
                endDate: filters.endDate,
                faultIds: filters.faultIds,
              }}
              onFiltersChange={handleFiltersChange}
              faults={faultsData?.data || []}
              hasActiveFilter={!!hasActiveFilter}
              onClear={clearAllFilters}
            />
          }
        />
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Card View Filters */}
          <div className="p-4 border-b border-gray-200">
            <TableFilters
              filters={{
                search: filters.search,
                status: filters.status,
                startDate: filters.startDate,
                endDate: filters.endDate,
                faultIds: filters.faultIds,
              }}
              onFiltersChange={handleFiltersChange}
              faults={faultsData?.data || []}
              hasActiveFilter={!!hasActiveFilter}
              onClear={clearAllFilters}
            />
          </div>

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
                              {service.isRepeatedService && (
                                <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                                  <RefreshCw className="w-3 h-3" />
                                  Repeat
                                </span>
                              )}
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

                                {assigningServiceId === service.id && (
                                  <div className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
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
                        <td className="px-2 py-4">
                          <div className="flex items-center justify-end" ref={actionMenuId === service.id ? actionMenuRef : null}>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActionMenuId(actionMenuId === service.id ? null : service.id);
                                }}
                                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Actions"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              {actionMenuId === service.id && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/services/${service.id}`);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Eye className="w-4 h-4 text-purple-600" />
                                    View
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingServiceId(service.id);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Edit2 className="w-4 h-4 text-orange-600" />
                                    Edit
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      handleDownloadJobsheet(e, service.id, service.jobSheet?.id);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    Jobsheet
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      handlePrintLabel(e, service.id);
                                      setActionMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <Tag className="w-4 h-4 text-cyan-600" />
                                    Print Label
                                  </button>
                                  {service.invoice && (
                                    <button
                                      onClick={(e) => {
                                        handleDownloadInvoice(e, service.invoice!.id);
                                        setActionMenuId(null);
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                      <Download className="w-4 h-4 text-green-600" />
                                      Invoice
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      handleDelete(e, service.id, service.ticketNumber);
                                      setActionMenuId(null);
                                    }}
                                    disabled={deleteMutation.isPending}
                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
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
                        {service.isRepeatedService && (
                          <span className="px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded flex items-center gap-0.5">
                            <RefreshCw className="w-3 h-3" />
                            Repeat
                          </span>
                        )}
                      </div>

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
                      <div className="relative" ref={actionMenuId === `mobile-${service.id}` ? actionMenuRef : null}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActionMenuId(actionMenuId === `mobile-${service.id}` ? null : `mobile-${service.id}`);
                          }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {actionMenuId === `mobile-${service.id}` && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            <button
                              onClick={() => {
                                navigate(`/services/${service.id}`);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="w-4 h-4 text-purple-600" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setEditingServiceId(service.id);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit2 className="w-4 h-4 text-orange-600" />
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                handleDownloadJobsheet(e, service.id, service.jobSheet?.id);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4 text-blue-600" />
                              Jobsheet
                            </button>
                            <button
                              onClick={(e) => {
                                handlePrintLabel(e, service.id);
                                setActionMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Tag className="w-4 h-4 text-cyan-600" />
                              Print Label
                            </button>
                            {service.invoice && (
                              <button
                                onClick={(e) => {
                                  handleDownloadInvoice(e, service.invoice!.id);
                                  setActionMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Download className="w-4 h-4 text-green-600" />
                                Invoice
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                handleDelete(e, service.id, service.ticketNumber);
                                setActionMenuId(null);
                              }}
                              disabled={deleteMutation.isPending}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
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
      )}

      {/* Edit Service Modal */}
      {editingServiceId && (
        <EditServiceModal
          isOpen={!!editingServiceId}
          onClose={() => setEditingServiceId(null)}
          serviceId={editingServiceId}
        />
      )}

      {/* Delivery Modal */}
      <DeliveryModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
      />
    </div>
  );
}
