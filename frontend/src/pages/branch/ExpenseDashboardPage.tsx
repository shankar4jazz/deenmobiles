import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi, pettyCashTransferApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Banknote, TrendingDown, TrendingUp, Wallet, Calendar, Receipt } from 'lucide-react';

type FilterType = 'month' | 'last3months' | 'alltime';

export default function ExpenseDashboardPage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('month');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Calculate date range based on filter type
  const getDateRange = () => {
    if (filterType === 'alltime') {
      return { startDate: undefined, endDate: undefined };
    }

    if (filterType === 'last3months') {
      const today = new Date();
      const threeMonthsAgo = subMonths(today, 3);
      return {
        startDate: format(startOfMonth(threeMonthsAgo), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      };
    }

    // month filter
    const monthDate = new Date(selectedMonth + '-01');
    return {
      startDate: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
    };
  };

  const { startDate, endDate } = getDateRange();

  // Fetch branch balance (all-time)
  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['branchBalance', branchId],
    queryFn: () => pettyCashTransferApi.getBranchBalance(branchId!),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch expenses for selected period
  const { data: expensesData, isLoading: expensesLoading, error } = useQuery({
    queryKey: ['expenses', branchId, filterType, startDate, endDate],
    queryFn: () => expenseApi.getAll({
      branchId: branchId || undefined,
      startDate,
      endDate,
      limit: 10000, // Get all expenses for the period
    }),
    enabled: !!branchId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const isLoading = balanceLoading || expensesLoading;

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading dashboard data. Please try again.</p>
        </div>
      </div>
    );
  }

  const expenses = expensesData?.data || [];

  // Calculate balance
  const balance = {
    currentBalance: Number(balanceData?.currentBalance || 0),
    totalReceived: Number(balanceData?.totalReceived || 0),
    totalExpenses: expenses.reduce((sum, exp) => sum + Number(exp.amount), 0),
  };

  const balanceColor = balance.currentBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceBgColor = balance.currentBalance >= 0 ? 'bg-green-50' : 'bg-red-50';
  const balanceBorderColor = balance.currentBalance >= 0 ? 'border-green-200' : 'border-red-200';

  // Calculate category-wise spending
  const categoryMap = expenses.reduce((acc, expense) => {
    const categoryId = expense.category?.id || 'uncategorized';
    const categoryName = expense.category?.name || 'Uncategorized';
    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId,
        categoryName,
        totalAmount: 0,
        count: 0,
      };
    }
    acc[categoryId].totalAmount += Number(expense.amount);
    acc[categoryId].count += 1;
    return acc;
  }, {} as Record<string, { categoryId: string; categoryName: string; totalAmount: number; count: number }>);

  const categoryWiseSpending = Object.values(categoryMap);

  // Find max amount for chart scaling
  const maxCategoryAmount = Math.max(
    ...categoryWiseSpending.map((cat) => cat.totalAmount),
    1
  );

  // Get recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

  // Get period display text
  const getPeriodText = () => {
    if (filterType === 'alltime') return 'All Time';
    if (filterType === 'last3months') return 'Last 3 Months';
    return format(new Date(selectedMonth + '-01'), 'MMMM yyyy');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expense Dashboard</h1>
            <p className="text-gray-600 text-sm">{branchName} - Petty Cash Management</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('month')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'month'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('last3months')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'last3months'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => setFilterType('alltime')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === 'alltime'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Time
          </button>

          {/* Month Selector - Only show when month filter is active */}
          {filterType === 'month' && (
            <div className="flex items-center gap-2 ml-auto">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={format(new Date(), 'yyyy-MM')}
                className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Period display for other filters */}
          {filterType !== 'month' && (
            <div className="flex items-center gap-2 ml-auto text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Calendar className="w-3.5 h-3.5" />
              <span className="font-medium">{getPeriodText()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance - Large Card */}
        <div className={`${balanceBgColor} ${balanceBorderColor} border-2 rounded-lg p-4 shadow-sm`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Current Balance</p>
              <p className={`text-2xl font-bold ${balanceColor}`}>
                ₹{balance.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  <span className="text-gray-600">Received:</span>
                  <span className="font-semibold text-green-600">
                    ₹{balance.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <TrendingDown className="w-3 h-3 text-red-600" />
                  <span className="text-gray-600">Spent:</span>
                  <span className="font-semibold text-red-600">
                    ₹{balance.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            <div className={`p-2 ${balance.currentBalance >= 0 ? 'bg-green-100' : 'bg-red-100'} rounded-lg`}>
              <Wallet className={`w-5 h-5 ${balanceColor}`} />
            </div>
          </div>
        </div>

        {/* Period Expenses */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">
                {filterType === 'alltime' ? 'Total Expenses' : filterType === 'last3months' ? 'Last 3 Months Expenses' : 'Monthly Expenses'}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{balance.totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {expenses.length} transactions
              </p>
              <p className="text-xs text-gray-400">
                {getPeriodText()}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Total Received */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 mb-1">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{balance.totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-gray-500 mt-1">All-time petty cash</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Banknote className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Category-wise Spending Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-gray-900">Category-wise Spending</h2>
          <p className="text-xs text-gray-600">
            {getPeriodText()} breakdown by expense category
          </p>
        </div>

        {categoryWiseSpending.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No expenses recorded for {getPeriodText()}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryWiseSpending
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .map((category) => {
                const percentage = (category.totalAmount / maxCategoryAmount) * 100;
                return (
                  <div key={category.categoryId} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-gray-700">{category.categoryName}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">
                          ₹{category.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-gray-500 ml-1">({category.count})</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Recent Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-900">Recent Expenses</h2>
          <p className="text-xs text-gray-600">Last 5 expenses from {getPeriodText()}</p>
        </div>

        {recentExpenses.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No expenses recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Expense #
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-medium text-purple-600">
                        {expense.expenseNumber}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-gray-900">
                        {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {expense.category?.name}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <p className="text-xs text-gray-900 line-clamp-2 max-w-xs">
                        {expense.description}
                      </p>
                      {expense.vendorName && (
                        <p className="text-xs text-gray-500">
                          Vendor: {expense.vendorName}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <span className="text-xs font-bold text-gray-900">
                        ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Low Balance Warning */}
      {balance.currentBalance < 5000 && balance.currentBalance >= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-medium text-yellow-800">Low Balance Warning</h3>
              <p className="text-xs text-yellow-700">
                Your petty cash balance is running low (₹{balance.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).
                Consider requesting additional funds from the admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {balance.currentBalance < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xs font-medium text-red-800">Negative Balance</h3>
              <p className="text-xs text-red-700">
                Your petty cash balance is negative (₹{balance.currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}).
                Please contact the admin immediately to resolve this discrepancy.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
