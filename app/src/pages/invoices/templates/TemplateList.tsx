import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { invoiceTemplateApi, InvoiceTemplate } from '@/services/invoiceTemplateApi';
import { useAuthStore } from '@/store/authStore';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Building,
} from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function TemplateList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch templates
  const { data, isLoading } = useQuery({
    queryKey: [
      'invoice-templates',
      currentPage,
      searchTerm,
      selectedBranch,
      showActiveOnly,
    ],
    queryFn: () =>
      invoiceTemplateApi.getAll({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        branchId: selectedBranch || undefined,
        isActive: showActiveOnly ? true : undefined,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: invoiceTemplateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
      alert('Template deleted successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to delete template');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: invoiceTemplateApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-templates'] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to toggle template status');
    },
  });

  const handleDelete = async (template: InvoiceTemplate) => {
    if (
      window.confirm(
        `Are you sure you want to delete the template "${template.name}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleToggleStatus = async (template: InvoiceTemplate) => {
    toggleStatusMutation.mutate(template.id);
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedBranch('');
    setShowActiveOnly(true);
    setCurrentPage(1);
  };

  const calculateTemplateTotal = (template: InvoiceTemplate) => {
    const subtotal = template.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const taxAmount = (subtotal * template.taxRate) / 100;
    return subtotal + taxAmount;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Invoice Templates
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage invoice templates for faster invoice creation
          </p>
        </div>
        <button
          onClick={() => navigate('/branch/settings?tab=invoice/create')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
                showFilters
                  ? 'bg-purple-50 border-purple-300 text-purple-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={showActiveOnly ? 'active' : 'all'}
                  onChange={(e) => setShowActiveOnly(e.target.value === 'active')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">All Templates</option>
                  <option value="active">Active Only</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-500 mt-2">Loading templates...</p>
          </div>
        ) : !data || data.templates.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No templates found</p>
            <button
              onClick={() => navigate('/branch/settings?tab=invoice/create')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create First Template
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.templates.map((template) => (
                    <tr
                      key={template.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {template.name}
                          </div>
                          {template.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {template.description}
                            </div>
                          )}
                          {template.branch && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Building className="w-3 h-3" />
                              {template.branch.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {template.items.length} item{template.items.length !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tax: {template.taxRate}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(calculateTemplateTotal(template))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(template)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                            template.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {template.isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4" />
                              Active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(template.createdAt), 'dd MMM yyyy')}
                        </div>
                        {template.createdByUser && (
                          <div className="text-xs text-gray-500">
                            by {template.createdByUser.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              navigate(`/branch/settings?tab=invoice/${template.id}`)
                            }
                            className="text-purple-600 hover:text-purple-900 p-1 hover:bg-purple-50 rounded transition-colors"
                            title="View Template"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/branch/settings?tab=invoice/${template.id}/edit`)
                            }
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Template"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(template)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                            title="Delete Template"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * limit + 1} to{' '}
                  {Math.min(currentPage * limit, data.pagination.total)} of{' '}
                  {data.pagination.total} templates
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(data.pagination.totalPages, p + 1)
                      )
                    }
                    disabled={currentPage === data.pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
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
