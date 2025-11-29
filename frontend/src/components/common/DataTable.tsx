import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnResizeMode,
} from '@tanstack/react-table';
import { Settings2, Loader2 } from 'lucide-react';
import { DataTableProps } from '../../types/table';
import TablePagination from './TablePagination';
import TableToolbar from './TableToolbar';
import {
  getSortIcon,
  getRowClassName,
  saveColumnVisibility,
  loadColumnVisibility,
} from '../../utils/tableUtils';

/**
 * Generic, reusable DataTable component built with TanStack Table v8
 *
 * @template TData - The type of data objects in the table
 *
 * @description
 * A fully-featured data table with advanced capabilities including:
 * - Column sorting (click headers to sort ascending/descending)
 * - Column visibility toggle (show/hide columns via dropdown)
 * - Column resizing (drag column borders to adjust width)
 * - Row selection (multi-select with checkboxes)
 * - Bulk actions (perform actions on selected rows)
 * - Pagination (with page navigation)
 * - Loading and empty states
 * - LocalStorage persistence for column visibility
 *
 * @example
 * ```tsx
 * const columns = [
 *   { accessorKey: 'name', header: 'Name', enableSorting: true },
 *   { accessorKey: 'email', header: 'Email', enableSorting: true },
 * ];
 *
 * <DataTable
 *   columns={columns}
 *   data={users}
 *   isLoading={loading}
 *   pagination={paginationData}
 *   onPageChange={setPage}
 *   enableRowSelection={true}
 *   enableSorting={true}
 *   enableColumnVisibility={true}
 *   enableColumnResizing={true}
 *   bulkActions={[{
 *     id: 'delete',
 *     label: 'Delete',
 *     onClick: (rows) => console.log(rows)
 *   }]}
 *   columnVisibilityKey="users-columns"
 * />
 * ```
 *
 * @see {@link README.md} for comprehensive documentation
 */
export default function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  emptyState,
  enableRowSelection = false,
  enableSorting = true,
  enableColumnVisibility = true,
  enableColumnResizing = true,
  bulkActions = [],
  columnVisibilityKey,
  onRowClick,
  initialSorting = [],
  onSortingChange,
  className = '',
  toolbarContent,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState(initialSorting);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});
  const [columnSizing, setColumnSizing] = useState({});
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  const columnResizeMode: ColumnResizeMode = 'onChange';

  // Load column visibility from localStorage on mount
  useEffect(() => {
    if (columnVisibilityKey) {
      const savedVisibility = loadColumnVisibility(columnVisibilityKey);
      if (savedVisibility) {
        setColumnVisibility(savedVisibility);
      }
    }
  }, [columnVisibilityKey]);

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    if (columnVisibilityKey) {
      saveColumnVisibility(columnVisibilityKey, columnVisibility);
    }
  }, [columnVisibility, columnVisibilityKey]);

  // Notify parent of sorting changes
  useEffect(() => {
    if (onSortingChange) {
      onSortingChange(sorting);
    }
  }, [sorting, onSortingChange]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnSizing,
    },
    enableRowSelection,
    enableSorting,
    enableColumnResizing,
    columnResizeMode,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const hasSelection = selectedRows.length > 0;

  const handleClearSelection = () => {
    table.resetRowSelection();
  };

  // Column visibility dropdown
  const columnVisibilityDropdown = enableColumnVisibility ? (
    <div className="relative">
      <button
        onClick={() => setShowColumnMenu(!showColumnMenu)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Settings2 className="h-4 w-4" />
        Columns
      </button>
      {showColumnMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowColumnMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-20">
            <div className="p-2 max-h-96 overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                      className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </span>
                  </label>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  ) : null;

  // Loading state
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <TableToolbar
        hasSelection={hasSelection}
        selectionCount={selectedRows.length}
        bulkActions={bulkActions}
        columnVisibilityDropdown={columnVisibilityDropdown}
        onClearSelection={handleClearSelection}
        selectedRows={selectedRows}
      >
        {toolbarContent}
      </TableToolbar>

      <div className="overflow-x-auto">
        <table
          className="w-full"
          style={{ minWidth: table.getTotalSize() }}
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider relative"
                    style={{
                      width: header.getSize(),
                      position: 'relative',
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center ${
                          header.column.getCanSort()
                            ? 'cursor-pointer select-none hover:text-gray-900'
                            : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && getSortIcon(header.column)}
                      </div>
                    )}
                    {enableColumnResizing && header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-purple-400 ${
                          header.column.getIsResizing() ? 'bg-purple-600' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-16 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    {emptyState?.icon && <div className="mb-4">{emptyState.icon}</div>}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {emptyState?.title || 'No data available'}
                    </h3>
                    {emptyState?.description && (
                      <p className="text-sm text-gray-500 mb-4 max-w-md">
                        {emptyState.description}
                      </p>
                    )}
                    {emptyState?.action && (
                      <button
                        onClick={emptyState.action.onClick}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-medium text-sm"
                      >
                        {emptyState.action.label}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={getRowClassName(row.getIsSelected(), !!onRowClick)}
                  onClick={() => onRowClick && onRowClick(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm text-gray-900"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && onPageChange && (
        <TablePagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
