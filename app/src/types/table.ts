import { ColumnDef, SortingState, ColumnFiltersState, VisibilityState, RowSelectionState } from '@tanstack/react-table';
import { ReactNode } from 'react';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DataTableProps<TData> {
  /**
   * Column definitions for the table
   */
  columns: ColumnDef<TData>[];

  /**
   * The data to display in the table
   */
  data: TData[];

  /**
   * Loading state
   */
  isLoading?: boolean;

  /**
   * Pagination configuration
   */
  pagination?: PaginationState;

  /**
   * Callback when page changes
   */
  onPageChange?: (page: number) => void;

  /**
   * Empty state configuration
   */
  emptyState?: {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };

  /**
   * Enable row selection
   */
  enableRowSelection?: boolean;

  /**
   * Enable column sorting
   */
  enableSorting?: boolean;

  /**
   * Enable column visibility toggle
   */
  enableColumnVisibility?: boolean;

  /**
   * Enable column resizing
   */
  enableColumnResizing?: boolean;

  /**
   * Bulk actions to display when rows are selected
   */
  bulkActions?: BulkAction[];

  /**
   * Local storage key for column visibility persistence
   */
  columnVisibilityKey?: string;

  /**
   * On row click handler
   */
  onRowClick?: (row: TData) => void;

  /**
   * Initial sorting state
   */
  initialSorting?: SortingState;

  /**
   * Callback when sorting changes (for server-side sorting)
   */
  onSortingChange?: (sorting: SortingState) => void;

  /**
   * Custom class names
   */
  className?: string;

  /**
   * Custom toolbar content to display alongside column visibility controls
   * Typically used for search inputs, filters, and other controls
   */
  toolbarContent?: ReactNode;
}

export interface BulkAction {
  /**
   * Unique identifier for the action
   */
  id: string;

  /**
   * Label to display
   */
  label: string;

  /**
   * Icon component
   */
  icon?: ReactNode;

  /**
   * Callback when action is clicked
   * Receives array of selected row data
   */
  onClick: (selectedRows: any[]) => void;

  /**
   * Variant styling
   */
  variant?: 'default' | 'danger';

  /**
   * Disable condition based on selected rows
   */
  isDisabled?: (selectedRows: any[]) => boolean;
}

export interface TableToolbarProps {
  /**
   * Whether any rows are selected
   */
  hasSelection: boolean;

  /**
   * Number of selected rows
   */
  selectionCount: number;

  /**
   * Bulk actions to display
   */
  bulkActions?: BulkAction[];

  /**
   * Column visibility toggle
   */
  columnVisibilityDropdown?: ReactNode;

  /**
   * Clear selection callback
   */
  onClearSelection: () => void;

  /**
   * Additional toolbar content (search, filters, etc.)
   */
  children?: ReactNode;
}

export interface TablePaginationProps {
  /**
   * Current page (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Total number of items
   */
  total: number;

  /**
   * Number of items per page
   */
  limit: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;
}

// Re-export commonly used TanStack Table types
export type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
};
