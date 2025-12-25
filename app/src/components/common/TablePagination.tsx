import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TablePaginationProps } from '../../types/table';

/**
 * Reusable table pagination component
 * Displays pagination controls with Previous/Next buttons and showing X-Y of Z format
 */
export default function TablePagination({
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
}: TablePaginationProps) {
  const startItem = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  const canGoToPrevious = currentPage > 1;
  const canGoToNext = currentPage < totalPages;

  const handlePrevious = () => {
    if (canGoToPrevious) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoToNext) {
      onPageChange(currentPage + 1);
    }
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
      <div className="flex-1 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={!canGoToPrevious}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              canGoToPrevious
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoToNext}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              canGoToNext
                ? 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
            }`}
            aria-label="Go to next page"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
