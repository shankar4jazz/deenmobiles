import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { branchApi } from '@/services/branchApi';
import BranchEmployeesModal from '@/components/branches/BranchEmployeesModal';
import { BranchFilters } from '@/types';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Building2,
  MapPin,
  Mail,
  Phone,
  User,
  AlertCircle,
  BarChart3,
} from 'lucide-react';

export default function BranchList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<BranchFilters>({
    search: '',
    isActive: undefined,
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);

  // Fetch branches
  const { data, isLoading } = useQuery({
    queryKey: ['branches', filters, page, limit],
    queryFn: () => branchApi.getAllBranches(filters, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: branchApi.deleteBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });

  const handleDelete = async (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete branch "${name}"? This action cannot be undone.`
      )
    ) {
      try {
        await deleteMutation.mutateAsync(id);
        alert('Branch deleted successfully');
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete branch');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Branches</h1>
            <p className="text-gray-600 mt-1">Manage your service center branches</p>
          </div>
          <button
            onClick={() => navigate('/branches/create')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Add Branch
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search branches..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={filters.isActive === undefined ? '' : filters.isActive.toString()}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isActive:
                    e.target.value === ''
                      ? undefined
                      : e.target.value === 'true',
                })
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Apply Filters
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : data?.branches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Building2 className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No branches found</p>
              <p className="text-sm">Create your first branch to get started</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employees
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
                    {data?.branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {branch.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {branch.code}
                              </div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {branch.address}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {branch.email}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {branch.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {branch.manager ? (
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {branch.manager.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {branch.manager.role.replace('_', ' ')}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">No manager</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedBranchId(branch.id);
                              setShowEmployeesModal(true);
                            }}
                            className="flex items-center gap-2 hover:bg-purple-50 px-3 py-1 rounded-lg transition-colors group"
                          >
                            <Users className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                            <span className="text-sm font-medium text-gray-900 group-hover:text-purple-600">
                              {branch._count?.users || 0}
                            </span>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {branch.isActive ? (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/branches/${branch.id}/dashboard`)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View dashboard"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/branches/edit/${branch.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit branch"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(branch.id, branch.name)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete branch"
                            >
                              <Trash2 className="h-4 w-4" />
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
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="text-sm text-gray-700">
                    Showing page {data.pagination.page} of {data.pagination.totalPages} (
                    {data.pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Employee Management Modal */}
      {selectedBranchId && (
        <BranchEmployeesModal
          branchId={selectedBranchId}
          isOpen={showEmployeesModal}
          onClose={() => {
            setShowEmployeesModal(false);
            setSelectedBranchId(null);
          }}
        />
      )}
    </>
  );
}
