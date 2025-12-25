import { format } from 'date-fns';
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { Column } from '@tanstack/react-table';

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date to readable format
 */
export const formatDate = (date: string | Date, formatStr: string = 'dd MMM yyyy'): string => {
  return format(new Date(date), formatStr);
};

/**
 * Get sort icon based on column sort state
 */
export const getSortIcon = <TData,>(column: Column<TData, unknown>) => {
  const isSorted = column.getIsSorted();

  if (!column.getCanSort()) {
    return null;
  }

  if (isSorted === 'asc') {
    return <ArrowUp className="ml-2 h-4 w-4" />;
  }

  if (isSorted === 'desc') {
    return <ArrowDown className="ml-2 h-4 w-4" />;
  }

  return <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />;
};

/**
 * Get status badge styles based on payment status
 */
export const getStatusBadgeStyles = (status: string): string => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PARTIAL: 'bg-blue-100 text-blue-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    COMPLETED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-red-100 text-red-800',
    ACTIVE: 'bg-green-100 text-green-800',
    INACTIVE: 'bg-gray-100 text-gray-800',
  };

  return `${baseStyles} ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Save column visibility to localStorage
 */
export const saveColumnVisibility = (key: string, visibility: Record<string, boolean>): void => {
  try {
    localStorage.setItem(key, JSON.stringify(visibility));
  } catch (error) {
    console.error('Failed to save column visibility:', error);
  }
};

/**
 * Load column visibility from localStorage
 */
export const loadColumnVisibility = (key: string): Record<string, boolean> | undefined => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : undefined;
  } catch (error) {
    console.error('Failed to load column visibility:', error);
    return undefined;
  }
};

/**
 * Get row background color based on selection state
 */
export const getRowClassName = (isSelected: boolean, isClickable: boolean): string => {
  const baseStyles = 'transition-colors';
  const hoverStyles = isClickable ? 'hover:bg-purple-50 cursor-pointer' : '';
  const selectedStyles = isSelected ? 'bg-purple-100' : '';

  return `${baseStyles} ${hoverStyles} ${selectedStyles}`.trim();
};

/**
 * Create a selection column for the table
 * Adds checkboxes for row selection with proper indeterminate state handling
 */
export const createSelectionColumn = <TData,>() => ({
  id: 'select',
  header: ({ table }: any) => {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = table.getIsAllPageRowsSelected();
    checkbox.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();

    return (
      <div className="flex items-center">
        <input
          type="checkbox"
          ref={(input) => {
            if (input) {
              input.indeterminate = table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected();
            }
          }}
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer"
          aria-label="Select all rows on this page"
        />
      </div>
    );
  },
  cell: ({ row }: any) => (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onChange={row.getToggleSelectedHandler()}
        className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Select row ${row.index + 1}`}
      />
    </div>
  ),
  enableSorting: false,
  enableResizing: false,
  enableHiding: false,
  size: 50,
  minSize: 50,
  maxSize: 50,
});
