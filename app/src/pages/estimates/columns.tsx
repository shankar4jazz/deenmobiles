import { ColumnDef } from '@tanstack/react-table';
import { Eye, Download, FileCheck, Calendar, Copy } from 'lucide-react';
import { Estimate } from '../../services/estimateApi';
import { formatCurrency, formatDate, createSelectionColumn } from '../../utils/tableUtils';
import ActionMenu from '../../components/common/ActionMenu';

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
    header: '',
    cell: ({ row }) => (
      <ActionMenu
        items={[
          {
            label: 'View',
            icon: <Eye className="h-4 w-4 text-purple-600" />,
            onClick: () => onView(row.original),
          },
          {
            label: 'Download',
            icon: <Download className="h-4 w-4 text-blue-600" />,
            onClick: () => onDownload(row.original),
            show: !!row.original.pdfUrl,
          },
          {
            label: 'Convert to Invoice',
            icon: <FileCheck className="h-4 w-4 text-green-600" />,
            onClick: () => onConvert(row.original),
            show: row.original.status === 'APPROVED',
          },
          {
            label: 'Clone',
            icon: <Copy className="h-4 w-4 text-blue-600" />,
            onClick: () => onClone(row.original),
          },
        ]}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];
