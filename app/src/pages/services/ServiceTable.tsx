import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Service, serviceApi } from '@/services/serviceApi';
import { technicianApi } from '@/services/technicianApi';
import { technicianKeys } from '@/lib/queryKeys';
import { useAuthStore } from '@/store/authStore';
import DataTable from '@/components/common/DataTable';
import EditServiceModal from '@/components/services/EditServiceModal';
import { createServiceColumns } from './columns';
import { Wrench } from 'lucide-react';

interface ServiceTableProps {
  services: Service[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
}

export default function ServiceTable({
  services,
  isLoading,
  pagination,
  onPageChange,
}: ServiceTableProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  // State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [assigningServiceId, setAssigningServiceId] = useState<string | null>(null);
  const [technicianSearch, setTechnicianSearch] = useState('');

  // Fetch technicians for assignment
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

  // Handlers
  const handleView = (service: Service) => {
    navigate(`/services/${service.id}`);
  };

  const handleEdit = (service: Service) => {
    setEditingServiceId(service.id);
  };

  const handleDelete = (service: Service) => {
    deleteMutation.mutate(service.id);
  };

  const handleAssign = (serviceId: string, technicianId: string) => {
    assignMutation.mutate({ serviceId, technicianId });
  };

  // Create columns with handlers
  const columns = useMemo(
    () =>
      createServiceColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAssign: handleAssign,
        technicians: techniciansData?.technicians || [],
        assigningServiceId,
        technicianSearch,
        setTechnicianSearch,
        setAssigningServiceId,
      }),
    [techniciansData?.technicians, assigningServiceId, technicianSearch]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={services}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={onPageChange}
        enableRowSelection={true}
        enableSorting={true}
        enableColumnVisibility={true}
        enableColumnResizing={true}
        columnVisibilityKey="services-table-columns"
        onRowClick={handleView}
        emptyState={{
          icon: <Wrench className="h-12 w-12 text-gray-400" />,
          title: 'No services found',
          description: 'Get started by creating a new service.',
          action: {
            label: 'Create Service',
            onClick: () => navigate('/services/create'),
          },
        }}
        className="bg-white rounded-lg shadow-sm border border-gray-200"
      />

      {/* Edit Modal */}
      {editingServiceId && (
        <EditServiceModal
          serviceId={editingServiceId}
          isOpen={!!editingServiceId}
          onClose={() => setEditingServiceId(null)}
          onSuccess={() => {
            setEditingServiceId(null);
            queryClient.invalidateQueries({ queryKey: ['services'] });
          }}
        />
      )}
    </>
  );
}
