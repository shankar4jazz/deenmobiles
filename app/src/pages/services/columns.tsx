import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit2, Trash2, User } from 'lucide-react';
import { Service, ServiceStatus } from '@/services/serviceApi';
import { formatCurrency, formatDate } from '@/utils/tableUtils';
import { useState, useRef, useEffect } from 'react';

// Status colors and labels
export const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ServiceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ServiceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ServiceStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ServiceStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
  [ServiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
  [ServiceStatus.NOT_SERVICEABLE]: 'bg-gray-100 text-gray-800',
};

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.COMPLETED]: 'Completed',
  [ServiceStatus.DELIVERED]: 'Delivered',
  [ServiceStatus.CANCELLED]: 'Cancelled',
  [ServiceStatus.NOT_SERVICEABLE]: 'Not Serviceable',
};

// Technician interface
interface Technician {
  id: string;
  name: string;
  email: string;
  activeServiceCount?: number;
}

// Technician Cell Component
function TechnicianCell({
  service,
  technicians,
  onAssign,
  isAssigning,
  technicianSearch,
  setTechnicianSearch,
  setAssigningServiceId,
}: {
  service: Service;
  technicians: Technician[];
  onAssign: (serviceId: string, technicianId: string) => void;
  isAssigning: boolean;
  technicianSearch: string;
  setTechnicianSearch: (search: string) => void;
  setAssigningServiceId: (id: string | null) => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAssigningServiceId(null);
        setTechnicianSearch('');
      }
    };

    if (isAssigning) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssigning, setAssigningServiceId, setTechnicianSearch]);

  const filteredTechnicians = technicians.filter((tech) =>
    tech.name.toLowerCase().includes(technicianSearch.toLowerCase()) ||
    tech.email.toLowerCase().includes(technicianSearch.toLowerCase())
  );

  if (service.assignedTo) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-3 h-3 text-blue-600" />
        </div>
        <span className="text-sm text-gray-900 truncate max-w-[100px]">
          {service.assignedTo.name}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setAssigningServiceId(isAssigning ? null : service.id);
          setTechnicianSearch('');
        }}
        className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded hover:bg-orange-100 transition-colors"
      >
        Unassigned
      </button>

      {isAssigning && (
        <div className="absolute z-50 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-2 border-b">
            <input
              type="text"
              value={technicianSearch}
              onChange={(e) => setTechnicianSearch(e.target.value)}
              placeholder="Search technician..."
              className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filteredTechnicians.length > 0 ? (
              filteredTechnicians.map((tech) => (
                <button
                  key={tech.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssign(service.id, tech.id);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                >
                  <span>{tech.name}</span>
                  {tech.activeServiceCount !== undefined && (
                    <span className="text-xs text-gray-400">
                      {tech.activeServiceCount} active
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500">No technicians found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Create service columns
export function createServiceColumns(options: {
  onView: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
  onAssign: (serviceId: string, technicianId: string) => void;
  technicians: Technician[];
  assigningServiceId: string | null;
  technicianSearch: string;
  setTechnicianSearch: (search: string) => void;
  setAssigningServiceId: (id: string | null) => void;
}): ColumnDef<Service>[] {
  const {
    onView,
    onEdit,
    onDelete,
    onAssign,
    technicians,
    assigningServiceId,
    technicianSearch,
    setTechnicianSearch,
    setAssigningServiceId,
  } = options;

  return [
    // Date
    {
      id: 'date',
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {formatDate(row.original.createdAt, 'dd MMM yyyy')}
        </div>
      ),
      enableSorting: true,
      size: 100,
    },

    // Job Sheet No (Ticket Number)
    {
      id: 'ticketNumber',
      accessorKey: 'ticketNumber',
      header: 'Job Sheet No',
      cell: ({ row }) => (
        <div className="font-medium text-purple-600">{row.original.ticketNumber}</div>
      ),
      enableSorting: true,
      enableHiding: false,
      size: 120,
    },

    // Customer Name
    {
      id: 'customerName',
      header: 'Customer',
      accessorFn: (row) => row.customer?.name,
      cell: ({ row }) => (
        <div className="font-medium text-gray-900 truncate max-w-[120px]">
          {row.original.customer?.name || '-'}
        </div>
      ),
      enableSorting: true,
      size: 130,
    },

    // Mobile
    {
      id: 'mobile',
      header: 'Mobile',
      accessorFn: (row) => row.customer?.phone,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600">
          {row.original.customer?.phone || '-'}
        </div>
      ),
      enableSorting: false,
      size: 110,
    },

    // Model
    {
      id: 'model',
      accessorKey: 'deviceModel',
      header: 'Model',
      cell: ({ row }) => (
        <div className="text-sm text-gray-900 truncate max-w-[100px]">
          {row.original.deviceModel || '-'}
        </div>
      ),
      enableSorting: true,
      size: 110,
    },

    // Fault
    {
      id: 'faults',
      header: 'Fault',
      cell: ({ row }) => {
        const faults = row.original.faults || [];
        if (faults.length === 0) return <span className="text-gray-400">-</span>;

        return (
          <div className="flex flex-wrap gap-1">
            {faults.slice(0, 2).map((f) => (
              <span
                key={f.id}
                className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded truncate max-w-[80px]"
                title={f.fault?.name}
              >
                {f.fault?.name || 'Unknown'}
              </span>
            ))}
            {faults.length > 2 && (
              <span className="text-xs text-gray-500">+{faults.length - 2}</span>
            )}
          </div>
        );
      },
      enableSorting: false,
      size: 150,
    },

    // Estimated Cost
    {
      id: 'estimatedCost',
      accessorKey: 'estimatedCost',
      header: 'Est. Cost',
      cell: ({ row }) => (
        <div className="text-sm font-medium text-gray-900">
          {formatCurrency(row.original.estimatedCost || 0)}
        </div>
      ),
      enableSorting: true,
      size: 100,
    },

    // Status
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
            STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-800'
          }`}
        >
          {STATUS_LABELS[row.original.status] || row.original.status}
        </span>
      ),
      enableSorting: true,
      size: 110,
    },

    // Technician
    {
      id: 'technician',
      header: 'Technician',
      cell: ({ row }) => (
        <TechnicianCell
          service={row.original}
          technicians={technicians}
          onAssign={onAssign}
          isAssigning={assigningServiceId === row.original.id}
          technicianSearch={technicianSearch}
          setTechnicianSearch={setTechnicianSearch}
          setAssigningServiceId={setAssigningServiceId}
        />
      ),
      enableSorting: false,
      size: 140,
    },

    // Booked By
    {
      id: 'bookedBy',
      header: 'Booked By',
      accessorFn: (row) => row.createdBy?.name,
      cell: ({ row }) => (
        <div className="text-sm text-gray-600 truncate max-w-[100px]">
          {row.original.createdBy?.name || '-'}
        </div>
      ),
      enableSorting: true,
      size: 110,
    },

    // Actions
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(row.original)}
            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(row.original)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this service?')) {
                onDelete(row.original);
              }
            }}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 100,
    },
  ];
}
