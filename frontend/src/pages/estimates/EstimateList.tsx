import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { estimateApi, Estimate } from '@/services/estimateApi';
import { useAuthStore } from '@/store/authStore';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
  FileCheck,
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { createEstimateColumns } from './columns';
import { BulkAction } from '@/types/table';

export default function EstimateList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch estimates with filters
  const { data, isLoading } = useQuery({
    queryKey: [
      'estimates',
      currentPage,
      searchTerm,
      selectedBranch,
      selectedStatus,
      startDate,
      endDate,
    ],
    queryFn: () =>
      estimateApi.getAll({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        branchId: selectedBranch || undefined,
        status: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const handleViewEstimate = (estimate: Estimate) => {
    navigate(`/branch/estimates/${estimate.id}`);
  };

  const handleDownloadPDF = async (estimate: Estimate) => {
    if (estimate.pdfUrl) {
      window.open(estimate.pdfUrl, '_blank');
    }
  };

  const handleConvertToInvoice = async (estimate: Estimate) => {
    try {
      const invoice = await estimateApi.convertToInvoice(estimate.id);
      navigate(`/branch/invoices/${invoice.id}`);
    } catch (error: any) {
      console.error('Failed to convert estimate:', error);
      alert(error.response?.data?.message || 'Failed to convert estimate to invoice');
    }
  };

  const handleCloneEstimate = (estimate: Estimate) => {
    navigate('/branch/estimates/create', { state: { cloneFrom: estimate } });
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedBranch('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Create column definitions with handlers
  const columns = useMemo(
    () => createEstimateColumns(handleViewEstimate, handleDownloadPDF, handleConvertToInvoice, handleCloneEstimate),
    []
  );

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'download-all',
      label: 'Download PDFs',
      icon: <Download className="h-4 w-4" />,
      onClick: (selectedRows: Estimate[]) => {
        selectedRows.forEach((estimate) => {
          if (estimate.pdfUrl) {
            window.open(estimate.pdfUrl, '_blank');
          }
        });
      },
      isDisabled: (selectedRows: Estimate[]) =>
        selectedRows.every((estimate) => !estimate.pdfUrl),
    },
    {
      id: 'convert-all',
      label: 'Convert to Invoices',
      icon: <FileCheck className="h-4 w-4" />,
      onClick: async (selectedRows: Estimate[]) => {
        const approvedEstimates = selectedRows.filter((e) => e.status === 'APPROVED');
        if (approvedEstimates.length === 0) {
          alert('No approved estimates selected');
          return;
        }
        if (
          window.confirm(
            `Convert ${approvedEstimates.length} approved estimate(s) to invoice(s)?`
          )
        ) {
          // TODO: Implement bulk convert API call
          console.log('Converting estimates:', approvedEstimates);
        }
      },
      isDisabled: (selectedRows: Estimate[]) =>
        !selectedRows.some((estimate) => estimate.status === 'APPROVED'),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: (selectedRows: Estimate[]) => {
        if (
          window.confirm(
            `Are you sure you want to delete ${selectedRows.length} estimate(s)?`
          )
        ) {
          // TODO: Implement bulk delete API call
          console.log('Deleting estimates:', selectedRows);
        }
      },
    },
  ];

  // Check if any filters are active
  const hasActiveFilters = !!(
    searchTerm ||
    selectedStatus ||
    startDate ||
    endDate
  );

  // Dynamic empty state based on filter status
  const emptyState = hasActiveFilters
    ? {
        icon: <Search className="w-12 h-12 text-gray-300" />,
        title: 'No estimates match your filters',
        description: 'Try adjusting your search or filter criteria',
        action: {
          label: 'Clear Filters',
          onClick: handleReset,
        },
      }
    : {
        icon: <FileText className="w-12 h-12 text-gray-300" />,
        title: 'No estimates found',
        description: 'Get started by creating your first estimate',
        action: {
          label: 'Create First Estimate',
          onClick: () => navigate('/branch/estimates/create'),
        },
      };

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Estimates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all estimates/quotations
          </p>
        </div>
        <button
          onClick={() => navigate('/branch/estimates/create')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Estimate
        </button>
      </div>

      {/* Estimates DataTable */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setCurrentPage}
        enableRowSelection={true}
        enableSorting={true}
        enableColumnVisibility={true}
        enableColumnResizing={true}
        bulkActions={bulkActions}
        columnVisibilityKey="estimate-column-visibility"
        onRowClick={handleViewEstimate}
        toolbarContent={
          <>
            {/* Search Bar and Filters Toggle */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by estimate number or customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors flex items-center gap-2 whitespace-nowrap ${
                  showFilters
                    ? 'bg-purple-50 border-purple-300 text-purple-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Collapsible Filters */}
            {showFilters && (
              <div className="w-full pt-3 mt-3 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="DRAFT">Draft</option>
                      <option value="SENT">Sent</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CONVERTED">Converted</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </>
        }
        emptyState={emptyState}
      />
    </div>
  );
}
