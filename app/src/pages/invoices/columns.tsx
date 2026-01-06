import { ColumnDef } from '@tanstack/react-table';
import { Eye, Download, Copy, Trash2 } from 'lucide-react';
import { Invoice } from '../../services/invoiceApi';
import { formatCurrency, formatDate, getStatusBadgeStyles, createSelectionColumn } from '../../utils/tableUtils';
import ActionMenu from '../../components/common/ActionMenu';

export const createInvoiceColumns = (
  onView: (invoice: Invoice) => void,
  onDownload: (invoice: Invoice) => void,
  onClone: (invoice: Invoice) => void,
  onDelete?: (invoice: Invoice) => void,
  latestInvoiceId?: string
): ColumnDef<Invoice>[] => [
  // Selection column
  createSelectionColumn<Invoice>(),

  // Invoice Number & Branch
  {
    id: 'invoice',
    accessorKey: 'invoiceNumber',
    header: 'Invoice',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">{row.original.invoiceNumber}</div>
        {row.original.branch && (
          <div className="text-sm text-gray-500">{row.original.branch.name}</div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 180,
  },

  // Service Ticket
  {
    id: 'service',
    header: 'Service',
    accessorFn: (row) => row.service?.ticketNumber,
    cell: ({ row }) => {
      const service = row.original.service;
      if (!service) return <span className="text-gray-400">-</span>;
      return (
        <div>
          <div className="font-medium text-gray-900">{service.ticketNumber}</div>
          <div className="text-sm text-gray-500">{service.deviceModel}</div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
    size: 180,
  },

  // Customer
  {
    id: 'customer',
    header: 'Customer',
    accessorFn: (row) => row.service?.customer?.name,
    cell: ({ row }) => {
      const customer = row.original.service?.customer;
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

  // Amount
  {
    id: 'amount',
    accessorKey: 'totalAmount',
    header: 'Amount',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-gray-900">
          {formatCurrency(row.original.totalAmount)}
        </div>
        {row.original.balanceAmount > 0 && (
          <div className="text-sm text-red-600">
            Due: {formatCurrency(row.original.balanceAmount)}
          </div>
        )}
      </div>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 150,
  },

  // Payment Status
  {
    id: 'status',
    accessorKey: 'paymentStatus',
    header: 'Status',
    cell: ({ row }) => (
      <span className={getStatusBadgeStyles(row.original.paymentStatus)}>
        {row.original.paymentStatus}
      </span>
    ),
    enableSorting: true,
    enableHiding: false,
    size: 120,
  },

  // Date
  {
    id: 'date',
    accessorKey: 'createdAt',
    header: 'Date',
    cell: ({ row }) => (
      <div className="text-sm text-gray-900">
        {formatDate(row.original.createdAt)}
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
    size: 110,
  },

  // Actions
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const isLatest = latestInvoiceId === row.original.id;
      return (
        <ActionMenu
          items={[
            {
              label: 'View',
              icon: <Eye className="h-4 w-4 text-purple-600" />,
              onClick: () => onView(row.original),
            },
            {
              label: 'Download',
              icon: <Download className="h-4 w-4 text-gray-600" />,
              onClick: () => onDownload(row.original),
              show: !!row.original.pdfUrl,
            },
            {
              label: 'Clone',
              icon: <Copy className="h-4 w-4 text-blue-600" />,
              onClick: () => onClone(row.original),
            },
            {
              label: 'Delete',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => onDelete?.(row.original),
              show: isLatest && !!onDelete,
              className: 'text-red-600 hover:bg-red-50',
            },
          ]}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];
