import { ColumnDef } from '@tanstack/react-table';
import { Eye, Download, FileCheck, Calendar, Copy } from 'lucide-react';
import { Estimate } from '../../services/estimateApi';
import { formatCurrency, formatDate, createSelectionColumn } from '../../utils/tableUtils';

const ESTIMATE_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  CONVERTED: 'bg-purple-100 text-purple-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

const ESTIMATE_STATUS_LABELS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CONVERTED: 'Converted',
  EXPIRED: 'Expired',
};

export const createEstimateColumns = (
  onView: (estimate: Estimate) => void,
  onDownload: (estimate: Estimate) => void,
  onConvert: (estimate: Estimate) => void,
  onClone: (estimate: Estimate) => void
): ColumnDef<Estimate>[] => [
  // Selection column
  createSelectionColumn<Estimate>(),

  // Estimate Number & Service Ticket
  {
    id: 'estimate',
    accessorKey: 'estimateNumber',
    header: 'Estimate #',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.estimateNumber}</div>
        {row.original.service && (
          <div className="text-sm text-gray-500">Ticket: {row.original.service.ticketNumber}</div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 180,
  },

  // Customer
  {
    id: 'customer',
    header: 'Customer',
    accessorFn: (row) => row.customer?.name,
    cell: ({ row }) => {
      const customer = row.original.customer;
      if (!customer) return <span className="text-gray-400">-</span>;
      return (
        <div>
          <div className="font-medium text-gray-900">{customer.name}</div>
          <div className="text-sm text-gray-500">{customer.phone}</div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: false,
    size: 200,
  },

  // Total Amount
  {
    id: 'amount',
    accessorKey: 'totalAmount',
    header: 'Total Amount',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">
          {formatCurrency(row.original.totalAmount)}
        </div>
        {row.original._count && row.original._count.items > 0 && (
          <div className="text-sm text-gray-500">
            {row.original._count.items} item{row.original._count.items !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 150,
  },

  // Status
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          ESTIMATE_STATUS_COLORS[row.original.status]
        }`}
      >
        {ESTIMATE_STATUS_LABELS[row.original.status]}
      </span>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 120,
  },

  // Valid Until
  {
    id: 'validUntil',
    accessorKey: 'validUntil',
    header: 'Valid Until',
    cell: ({ row }) => {
      if (!row.original.validUntil) {
        return <span className="text-sm text-gray-400">-</span>;
      }
      return (
        <div className="text-sm text-gray-900 flex items-center gap-1">
          <Calendar className="w-4 h-4 text-gray-400" />
          {formatDate(row.original.validUntil)}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    size: 140,
  },

  // Created Date
  {
    id: 'date',
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <div className="text-sm text-gray-900 flex items-center gap-1">
        <Calendar className="w-4 h-4 text-gray-400" />
        {formatDate(row.original.createdAt)}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 130,
  },

  // Actions
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView(row.original)}
          className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          title="View Details"
        >
          <Eye className="h-4 w-4" />
        </button>
        {row.original.pdfUrl && (
          <button
            onClick={() => onDownload(row.original)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        {row.original.status === 'APPROVED' && (
          <button
            onClick={() => onConvert(row.original)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-md transition-colors"
            title="Convert to Invoice"
          >
            <FileCheck className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onClone(row.original)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          title="Clone Estimate"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 120,
  },
];
