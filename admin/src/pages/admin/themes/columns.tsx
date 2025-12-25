import { ColumnDef } from '@tanstack/react-table';
import { Eye, Edit, Trash2, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { Theme } from '@/services/themeApi';
import { formatDate, createSelectionColumn } from '@/utils/tableUtils';

export const createThemeColumns = (
  onView: (theme: Theme) => void,
  onEdit: (theme: Theme) => void,
  onDelete: (theme: Theme) => void,
  onToggleStatus: (theme: Theme) => void,
  onSetDefault: (theme: Theme) => void
): ColumnDef<Theme>[] => [
  // Selection column
  createSelectionColumn<Theme>(),

  // Theme Name
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Theme Name',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900 flex items-center gap-2">
          {row.original.name}
          {row.original.isDefault && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Default Theme" />
          )}
        </div>
        {row.original.description && (
          <div className="text-sm text-gray-500">{row.original.description}</div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 250,
  },

  // Colors Preview
  {
    id: 'colors',
    header: 'Colors',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-gray-300"
          style={{ backgroundColor: row.original.primaryColor }}
          title={`Primary: ${row.original.primaryColor}`}
        />
        <div
          className="w-8 h-8 rounded border border-gray-300"
          style={{ backgroundColor: row.original.secondaryColor }}
          title={`Secondary: ${row.original.secondaryColor}`}
        />
        <div
          className="w-8 h-8 rounded border border-gray-300"
          style={{ backgroundColor: row.original.headerBackgroundColor }}
          title={`Header: ${row.original.headerBackgroundColor}`}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
    size: 130,
  },

  // Font
  {
    id: 'font',
    header: 'Font',
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="font-medium text-gray-900">{row.original.fontFamily}</div>
        <div className="text-gray-500">{row.original.fontSize}pt</div>
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
    size: 120,
  },

  // Branch
  {
    id: 'branch',
    header: 'Branch',
    cell: ({ row }) => (
      <div className="text-sm">
        {row.original.branch ? (
          <div>
            <div className="font-medium text-gray-900">{row.original.branch.name}</div>
            <div className="text-gray-500">{row.original.branch.code}</div>
          </div>
        ) : (
          <span className="text-gray-500 italic">Company-wide</span>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: true,
    size: 150,
  },

  // Status
  {
    id: 'status',
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          row.original.isActive
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}
      >
        {row.original.isActive ? 'Active' : 'Inactive'}
      </span>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 100,
  },

  // Created Date
  {
    id: 'date',
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <div className="text-sm">
        <div className="text-gray-900">{formatDate(row.original.createdAt)}</div>
        <div className="text-gray-500">{row.original.createdByUser.name}</div>
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 150,
  },

  // Actions
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView(row.original)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        <button
          onClick={() => onEdit(row.original)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Edit Theme"
        >
          <Edit className="h-4 w-4" />
        </button>
        {!row.original.isDefault && (
          <button
            onClick={() => onSetDefault(row.original)}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors"
            title="Set as Default"
          >
            <Star className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onToggleStatus(row.original)}
          className={`p-2 rounded-md transition-colors ${
            row.original.isActive
              ? 'text-gray-600 hover:bg-gray-50'
              : 'text-green-600 hover:bg-green-50'
          }`}
          title={row.original.isActive ? 'Deactivate' : 'Activate'}
          disabled={row.original.isDefault && row.original.isActive}
        >
          {row.original.isActive ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
        </button>
        {!row.original.isDefault && (
          <button
            onClick={() => onDelete(row.original)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            title="Delete Theme"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 180,
  },
];
