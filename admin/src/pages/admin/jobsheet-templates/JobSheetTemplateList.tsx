import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jobSheetTemplateApi, JobSheetTemplate } from '@/services/jobSheetTemplateApi';
import { jobSheetTemplateCategoryApi } from '@/services/jobSheetTemplateCategoryApi';
import { useAuthStore } from '@/store/authStore';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Trash2,
  FolderCog,
} from 'lucide-react';
import DataTable from '@/components/common/DataTable';
import { createJobSheetTemplateColumns } from './columns';
import { BulkAction } from '@/types/table';
import { toast } from 'sonner';

export default function JobSheetTemplateList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['jobSheetTemplateCategories'],
    queryFn: () => jobSheetTemplateCategoryApi.getAll({ limit: 100 }),
  });

  // Fetch templates with filters
  const { data, isLoading } = useQuery({
    queryKey: ['jobSheetTemplates', currentPage, searchTerm, selectedStatus, selectedCategory],
    queryFn: () =>
      jobSheetTemplateApi.getAll({
        page: currentPage,
        limit,
        search: searchTerm || undefined,
        isActive: selectedStatus === 'active' ? true : selectedStatus === 'inactive' ? false : undefined,
        categoryId: selectedCategory || undefined,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: jobSheetTemplateApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobSheetTemplates'] });
      toast.success('Theme deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete theme');
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: jobSheetTemplateApi.toggleStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobSheetTemplates'] });
      toast.success('Theme status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Set default mutation
  const setDefaultMutation = useMutation({
    mutationFn: jobSheetTemplateApi.setAsDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobSheetTemplates'] });
      toast.success('Default theme updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to set default');
    },
  });

  // Handlers
  const handleView = (template: JobSheetTemplate) => {
    navigate(`/settings?tab=job-sheet&id=${template.id}`);
  };

  const handleEdit = (template: JobSheetTemplate) => {
    navigate(`/settings?tab=job-sheet&id=${template.id}&edit=true`);
  };

  const handleDelete = (template: JobSheetTemplate) => {
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      deleteMutation.mutate(template.id);
    }
  };

  const handleToggleStatus = (template: JobSheetTemplate) => {
    toggleStatusMutation.mutate(template.id);
  };

  const handleSetDefault = (template: JobSheetTemplate) => {
    setDefaultMutation.mutate(template.id);
  };

  // Bulk actions
  const bulkActions: BulkAction<JobSheetTemplate>[] = [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: Trash2,
      variant: 'danger',
      onClick: async (selected) => {
        if (window.confirm(`Delete ${selected.length} selected themes?`)) {
          await Promise.all(selected.map((template) => jobSheetTemplateApi.delete(template.id)));
          queryClient.invalidateQueries({ queryKey: ['jobSheetTemplates'] });
          toast.success(`${selected.length} themes deleted`);
        }
      },
    },
  ];

  // Create columns
  const columns = useMemo(
    () =>
      createJobSheetTemplateColumns(
        handleView,
        handleEdit,
        handleDelete,
        handleToggleStatus,
        handleSetDefault
      ),
    []
  );

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Sheet Themes</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/settings?tab=job-sheet&action=categories')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <FolderCog className="w-4 h-4" />
            Manage Categories
          </button>
          <button
            onClick={() => navigate('/settings?tab=job-sheet&action=create')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Theme
          </button>
        </div>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        pagination={{
          page: currentPage,
          limit,
          total: data?.pagination.total || 0,
          totalPages: data?.pagination.totalPages || 1,
          onPageChange: setCurrentPage,
        }}
        searchConfig={{
          value: searchTerm,
          onChange: setSearchTerm,
          placeholder: 'Search themes...',
        }}
        filtersConfig={{
          show: showFilters,
          onToggle: () => setShowFilters(!showFilters),
          filters: (
            <>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Categories</option>
                {categoriesData?.data.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </>
          ),
        }}
        bulkActions={bulkActions}
        emptyState={{
          icon: FileText,
          title: 'No themes found',
          description: searchTerm
            ? 'Try adjusting your search or filters'
            : 'Get started by creating your first theme',
          action: !searchTerm
            ? {
                label: 'Create Theme',
                onClick: () => navigate('/settings?tab=job-sheet&action=create'),
              }
            : undefined,
        }}
      />
    </div>
  );
}
