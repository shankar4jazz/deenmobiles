import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supplierApi } from '../../services/supplierApi';
import { Supplier, SupplierFilters } from '../../types';
import AddSupplierModal from '../../components/suppliers/AddSupplierModal';
import EditSupplierModal from '../../components/suppliers/EditSupplierModal';
import { useAuthStore } from '@/store/authStore';

const SupplierList: React.FC = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // State
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    limit: 10,
    search: '',
    active: undefined,
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(
    null
  );

  // Fetch suppliers - include branchId for branch-specific filtering
  const { data, isLoading, isError, error, isSuccess } = useQuery({
    queryKey: ['suppliers', filters, user?.activeBranch?.id],
    queryFn: () => {
      console.log('🔍 [SupplierList] Fetching suppliers with params:', {
        filters,
        branchId: user?.activeBranch?.id
      });
      return supplierApi.getAllSuppliers({
        ...filters,
        branchId: user?.activeBranch?.id
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Log component mount and user info
  useEffect(() => {
    console.log('🏪 [SupplierList] Component mounted');
    console.log('👤 [SupplierList] User info:', user);
    console.log('🏢 [SupplierList] Active Branch ID:', user?.activeBranch?.id);
    console.log('🏢 [SupplierList] Active Branch Name:', user?.activeBranch?.name);
  }, []);

  // Log query results
  useEffect(() => {
    if (isSuccess && data) {
      console.log('✅ [SupplierList] Query successful. Data:', data);
      console.log('📊 [SupplierList] Supplier count:', data.suppliers?.length || 0);
    }
    if (isError) {
      console.error('❌ [SupplierList] Query error:', error);
    }
  }, [isSuccess, isError, data, error]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });

  const handleSearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleActiveFilter = (active: boolean | undefined) => {
    setFilters((prev) => ({ ...prev, active, page: 1 }));
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete supplier "${name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete supplier');
      }
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-1">
              Manage your supplier information and contacts
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Supplier
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, code, phone, or GST number..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={
                  filters.active === undefined
                    ? 'all'
                    : filters.active
                    ? 'active'
                    : 'inactive'
                }
                onChange={(e) =>
                  handleActiveFilter(
                    e.target.value === 'all'
                      ? undefined
                      : e.target.value === 'active'
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Suppliers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading suppliers...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">
              Error loading suppliers. Please try again.
            </div>
          ) : data && data.suppliers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Supplier Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.suppliers.map((supplier: Supplier) => (
                      <tr
                        key={supplier.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {/* Supplier Info */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {supplier.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Code: {supplier.supplierCode}
                            </p>
                            {supplier.companyName && (
                              <p className="text-xs text-gray-600 mt-1">
                                {supplier.companyName}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {supplier.phone && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-3 h-3 mr-2" />
                                {supplier.phone}
                              </div>
                            )}
                            {supplier.email && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Mail className="w-3 h-3 mr-2" />
                                {supplier.email}
                              </div>
                            )}
                            {!supplier.phone && !supplier.email && (
                              <span className="text-xs text-gray-400">
                                No contact info
                              </span>
                            )}
                          </div>
                        </td>

                        {/* GST Details */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {supplier.gstNumber && (
                              <div>
                                <p className="text-xs text-gray-500">GST</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {supplier.gstNumber}
                                </p>
                              </div>
                            )}
                            {supplier.panNumber && (
                              <div>
                                <p className="text-xs text-gray-500">PAN</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {supplier.panNumber}
                                </p>
                              </div>
                            )}
                            {!supplier.gstNumber && !supplier.panNumber && (
                              <span className="text-xs text-gray-400">
                                No GST/PAN
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-6 py-4">
                          <div className="flex items-start text-sm text-gray-600">
                            {supplier.city || supplier.state ? (
                              <>
                                <MapPin className="w-3 h-3 mr-1 mt-1 flex-shrink-0" />
                                <div>
                                  {supplier.city && (
                                    <p>{supplier.city}</p>
                                  )}
                                  {supplier.state && (
                                    <p className="text-xs">{supplier.state}</p>
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-gray-400">
                                No location
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {supplier.active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingSupplierId(supplier.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(supplier.id, supplier.name)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <p className="text-sm text-gray-600">
                    Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{' '}
                    {Math.min(
                      data.pagination.page * data.pagination.limit,
                      data.pagination.total
                    )}{' '}
                    of {data.pagination.total} suppliers
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page! - 1),
                        }))
                      }
                      disabled={data.pagination.page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: prev.page! + 1 }))
                      }
                      disabled={
                        data.pagination.page === data.pagination.totalPages
                      }
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No suppliers found</p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first supplier
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddSupplierModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
        }}
      />

      {editingSupplierId && (
        <EditSupplierModal
          isOpen={!!editingSupplierId}
          onClose={() => setEditingSupplierId(null)}
          supplierId={editingSupplierId}
          onSuccess={() => {
            setEditingSupplierId(null);
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          }}
        />
      )}
    </>
  );
};

export default SupplierList;
