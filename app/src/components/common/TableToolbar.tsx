import { X } from 'lucide-react';
import { TableToolbarProps } from '../../types/table';

/**
 * Table toolbar component for displaying bulk actions and search/filter controls
 * Shows a highlighted bar when rows are selected with bulk action buttons
 */
export default function TableToolbar({
  hasSelection,
  selectionCount,
  bulkActions = [],
  columnVisibilityDropdown,
  onClearSelection,
  children,
  selectedRows = [],
}: TableToolbarProps & { selectedRows?: any[] }) {
  if (hasSelection) {
    return (
      <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-4">
          <span className="font-medium">
            {selectionCount} {selectionCount === 1 ? 'item' : 'items'} selected
          </span>
          <div className="flex items-center gap-2">
            {bulkActions.map((action) => {
              const isDisabled = action.isDisabled
                ? action.isDisabled(selectedRows)
                : false;
              return (
                <button
                  key={action.id}
                  onClick={() => action.onClick(selectedRows)}
                  disabled={isDisabled}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    action.variant === 'danger'
                      ? 'bg-red-500 hover:bg-red-600 text-white disabled:bg-red-300 disabled:cursor-not-allowed'
                      : 'bg-white text-purple-700 hover:bg-purple-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {action.icon}
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
        <button
          onClick={onClearSelection}
          className="p-2 hover:bg-purple-700 rounded-md transition-colors"
          aria-label="Clear selection"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-start justify-between gap-3">
        {children && <div className="flex-1 flex flex-col gap-0">{children}</div>}
        {columnVisibilityDropdown && (
          <div className="flex-shrink-0 ml-auto">{columnVisibilityDropdown}</div>
        )}
      </div>
    </div>
  );
}
