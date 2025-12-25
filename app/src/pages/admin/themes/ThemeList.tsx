import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { themeApi, Theme } from '@/services/themeApi';
import { useAuthStore } from '@/store/authStore';
import {
  Palette,
  Search,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { createThemeColumns } from './columns';
import { BulkAction } from '@/types/table';

export default function ThemeList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch themes with filters
  const { data, isLoading } = useQuery({
    queryKey: ['themes', currentPage, searchTerm, selectedStatus],
    queryFn: () =>
      themeApi.getAll({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
      }),
    staleTime: 10 * 60 * 1000, // 10 minutes - themes rarely change
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: themeApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: themeApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: themeApi.setAsDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['themes'] });
    },
  });

  const handleViewTheme = (theme: Theme) => {
    navigate(`/branch/settings?tab=invoice/${theme.id}`);
  };

  const handleEditTheme = (theme: Theme) => {
    navigate(`/branch/settings?tab=invoice/${theme.id}/edit`);
  };

  const handleDeleteTheme = async (theme: Theme) => {
    if (window.confirm(`Are you sure you want to delete "${theme.name}"?`)) {
      try {
        await deleteMutation.mutateAsync(theme.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete theme');
      }
    }
  };

  const handleToggleStatus = async (theme: Theme) => {
    try {
      await toggleStatusMutation.mutateAsync(theme.id);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle theme status');
    }
  };

  const handleSetDefault = async (theme: Theme) => {
    if (window.confirm(`Set "${theme.name}" as the default theme?`)) {
      try {
        await setDefaultMutation.mutateAsync(theme.id);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to set default theme');
      }
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedStatus('');
    setCurrentPage(1);
  };

  // Create column definitions with handlers
  const columns = useMemo(
    () => createThemeColumns(
      handleViewTheme,
      handleEditTheme,
      handleDeleteTheme,
      handleToggleStatus,
      handleSetDefault
    ),
    []
  );

  // Bulk actions
  const bulkActions: BulkAction[] = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'danger',
      onClick: async (selectedRows: Theme[]) => {
        const nonDefaultThemes = selectedRows.filter(t => !t.isDefault);
        if (nonDefaultThemes.length === 0) {
          alert('Cannot delete default themes');
          return;
        }
        if (
          window.confirm(
            `Are you sure you want to delete ${nonDefaultThemes.length} theme(s)?`
          )
        ) {
          try {
            await Promise.all(
              nonDefaultThemes.map((theme) => deleteMutation.mutateAsync(theme.id))
            );
          } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to delete themes');
          }
        }
      },
      isDisabled: (selectedRows: Theme[]) =>
        selectedRows.every((theme) => theme.isDefault),
    },
  ];

  // Check if any filters are active
  const hasActiveFilters = !!(searchTerm || selectedStatus);

  // Dynamic empty state based on filter status
  const emptyState = hasActiveFilters
    ? {
        icon: <Search className="w-12 h-12 text-gray-300" />,
        title: 'No themes match your filters',
        description: 'Try adjusting your search or filter criteria',
        action: {
          label: 'Clear Filters',
          onClick: handleReset,
        },
      }
    : {
        icon: <Palette className="w-12 h-12 text-gray-300" />,
        title: 'No themes found',
        description: 'Get started by creating your first PDF theme',
        action: {
          label: 'Create First Theme',
          onClick: () => navigate('/branch/settings?tab=invoice/create'),
        },
      };

  return (
    <div className="px-4 py-6 max-w-[1400px] mx-auto lg:px-6 xl:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Palette className="w-7 h-7" />
            PDF Themes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Customize the appearance of your invoices and estimates
          </p>
        </div>
        <button
          onClick={() => navigate('/branch/settings?tab=invoice/create')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Theme
        </button>
      </div>

      {/* Themes DataTable */}
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
        columnVisibilityKey="theme-column-visibility"
        onRowClick={handleViewTheme}
        toolbarContent={
          <>
            {/* Search Bar and Filters Toggle */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by theme name or description..."
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
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
