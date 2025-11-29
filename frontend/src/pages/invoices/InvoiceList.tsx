import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceApi, Invoice } from '@/services/invoiceApi';
import { useAuthStore } from '@/store/authStore';
import {
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { createInvoiceColumns } from './columns';
import { BulkAction } from '@/types/table';

export default function InvoiceList() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch invoices with filters
  const { data, isLoading } = useQuery({
    queryKey: [
      'invoices',
      currentPage,
      searchTerm,
      selectedBranch,
      selectedStatus,
      startDate,
      endDate,
      showDueOnly,
    ],
    queryFn: () =>
      invoiceApi.getAll({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        branchId: selectedBranch || undefined,
        paymentStatus: selectedStatus || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  // Filter for due/pending invoices on client side
  const filteredData = showDueOnly && data?.data
    ? data.data.filter(invoice =>
        invoice.paymentStatus === 'PENDING' || invoice.paymentStatus === 'PARTIAL'
      )
    : data?.data;

  const handleViewInvoice = (invoice: Invoice) => {
    navigate(`/branch/invoices/${invoice.id}`);
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const handleCloneInvoice = (invoice: Invoice) => {
    navigate('/branch/invoices/create', { state: { cloneFrom: invoice } });
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedBranch('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setShowDueOnly(false);
    setCurrentPage(1);
  };

  // Create column definitions with handlers
  const columns = useMemo(
    () => createInvoiceColumns(handleViewInvoice, handleDownloadPDF, handleCloneInvoice),
    []
  );

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'download-all',
      label: 'Download PDFs',
      icon: <Download className="h-4 w-4" />,
      onClick: (selectedRows: Invoice[]) => {
        selectedRows.forEach((invoice) => {
          if (invoice.pdfUrl) {
            window.open(invoice.pdfUrl, '_blank');
          }
        });
      },
      isDisabled: (selectedRows: Invoice[]) =>
        selectedRows.every((invoice) => !invoice.pdfUrl),
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: (selectedRows: Invoice[]) => {
        if (
          window.confirm(
            `Are you sure you want to delete ${selectedRows.length} invoice(s)?`
          )
        ) {
          // TODO: Implement bulk delete API call
          console.log('Deleting invoices:', selectedRows);
        }
      },
    },
  ];

  // Check if any filters are active
  const hasActiveFilters = !!(
    searchTerm ||
    selectedStatus ||
    startDate ||
    endDate ||
    showDueOnly
  );

  // Dynamic empty state based on filter status
  const emptyState = hasActiveFilters
    ? {
        icon: <Search className="w-12 h-12 text-gray-300" />,
        title: 'No invoices match your filters',
        description: 'Try adjusting your search or filter criteria',
        action: {
          label: 'Clear Filters',
          onClick: handleReset,
        },
      }
    : {
        icon: <FileText className="w-12 h-12 text-gray-300" />,
        title: 'No invoices found',
        description: 'Get started by creating your first invoice',
        action: {
          label: 'Create First Invoice',
          onClick: () => navigate('/branch/invoices/create'),
        },
      };

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and track all invoices
          </p>
        </div>
        <button
          onClick={() => navigate('/branch/invoices/create')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Generate Invoice
        </button>
      </div>

      {/* Invoices DataTable */}
      <DataTable
        columns={columns}
        data={filteredData || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setCurrentPage}
        enableRowSelection={true}
        enableSorting={true}
        enableColumnVisibility={true}
        enableColumnResizing={true}
        bulkActions={bulkActions}
        columnVisibilityKey="invoice-column-visibility"
        onRowClick={handleViewInvoice}
        toolbarContent={
          <>
            {/* Search Bar and Filters Toggle */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by invoice number, ticket number, or customer..."
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
                      Payment Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => {
                        setSelectedStatus(e.target.value);
                        setShowDueOnly(false);
                      }}
                      disabled={showDueOnly}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">All Statuses</option>
                      <option value="PENDING">Pending</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="REFUNDED">Refunded</option>
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

                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDueOnly}
                      onChange={(e) => {
                        setShowDueOnly(e.target.checked);
                        if (e.target.checked) {
                          setSelectedStatus('');
                        }
                      }}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">Show Due/Pending Only</span>
                  </label>

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
