import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Calendar, X, Receipt } from 'lucide-react';
import { ExpenseFilters } from '../../types/expense';

export default function ExpenseHistoryPage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Filters state
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Build filters object
  const filters: ExpenseFilters = {
    page,
    limit,
    branchId: branchId || undefined,
    search: search || undefined,
    categoryId: categoryId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  // Fetch expenses
  const { data: expensesData, isLoading, error } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expenseApi.getAll(filters),
    enabled: !!branchId,
  });

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!expensesData?.data || expensesData.data.length === 0) return;

    const headers = ['Expense #', 'Date', 'Category', 'Description', 'Vendor', 'Amount', 'Recorded By'];
    const rows = expensesData.data.map(expense => [
      expense.expenseNumber,
      format(new Date(expense.expenseDate), 'dd/MM/yyyy'),
      expense.category?.name || '-',
      expense.description,
      expense.vendorName || '-',
      expense.amount.toString(),
      expense.recordedByUser?.name || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading expense history. Please try again.</p>
        </div>
      </div>
    );
  }

  const hasActiveFilters = search || categoryId || startDate || endDate;

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense History</h1>
          <p className="text-gray-600 mt-1">{branchName} - Complete expense records</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-purple-100 text-purple-700 text-xs font-medium px-2 py-0.5 rounded-full">
                Active
              </span>
            )}
          </button>
          <button
            onClick={exportToCSV}
            disabled={!expensesData?.data || expensesData.data.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700"
              >
                <X className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search expenses..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  max={endDate || format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  min={startDate}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Expenses</h2>
              <p className="text-sm text-gray-600 mt-1">
                {expensesData?.pagination.total || 0} total expenses
              </p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : expensesData?.data.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No expenses found</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                Clear filters to see all expenses
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded By
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expensesData?.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">
                          {expense.expenseNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {format(new Date(expense.expenseDate), 'hh:mm a')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {expense.category?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {expense.description}
                        </p>
                        {expense.vendorName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Vendor: {expense.vendorName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {expense.recordedByUser?.name || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {expensesData && expensesData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, expensesData.pagination.total)} of {expensesData.pagination.total} expenses
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, expensesData.pagination.totalPages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1.5 rounded-lg transition-colors ${
                            page === pageNum
                              ? 'bg-purple-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === expensesData.pagination.totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
