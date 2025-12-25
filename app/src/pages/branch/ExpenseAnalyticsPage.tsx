import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { expenseApi } from '../../services/expenseApi';
import { useAuthStore } from '../../store/authStore';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { Calendar, TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#6366F1', '#14B8A6'];

type FilterType = 'month' | 'last3months' | 'alltime';

export default function ExpenseAnalyticsPage() {
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
  const monthDate = new Date(selectedMonth + '-01');

  // Fetch expenses for the selected period
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', branchId, filterType, startDate, endDate],
    queryFn: () => expenseApi.getAll({
      branchId: branchId || undefined,
      startDate,
      endDate,
      limit: 10000, // Get all expenses for the period
    }),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes - analytics data changes less frequently
  });

  // Fetch dashboard data for additional stats
  const { data: dashboardData } = useQuery({
    queryKey: ['expenseDashboard', branchId],
    queryFn: () => expenseApi.getBranchDashboard(branchId!),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

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

  const expenses = expensesData?.data || [];

  // Calculate category-wise data for pie chart
  const categoryData = expenses.reduce((acc, expense) => {
    const categoryName = expense.category?.name || 'Uncategorized';
    const existing = acc.find(item => item.name === categoryName);
    if (existing) {
      existing.value += Number(expense.amount);
      existing.count += 1;
    } else {
      acc.push({
        name: categoryName,
        value: Number(expense.amount),
        count: 1,
      });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; count: number }>);

  // Sort by value descending
  categoryData.sort((a, b) => b.value - a.value);

  // Calculate daily expenses for line chart
  const dailyData = expenses.reduce((acc, expense) => {
    const day = format(new Date(expense.expenseDate), 'yyyy-MM-dd');
    const existing = acc.find(item => item.date === day);
    if (existing) {
      existing.amount += Number(expense.amount);
      existing.count += 1;
    } else {
      acc.push({
        date: day,
        amount: Number(expense.amount),
        count: 1,
      });
    }
    return acc;
  }, [] as Array<{ date: string; amount: number; count: number }>);

  // Fill in missing days with 0
  const allDays = eachDayOfInterval({ start: new Date(startDate), end: new Date(endDate) });
  const completeDaily = allDays.map(day => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const existing = dailyData.find(item => item.date === dateStr);
    return {
      date: format(day, 'MMM dd'),
      fullDate: dateStr,
      amount: existing?.amount || 0,
      count: existing?.count || 0,
    };
  });

  // Calculate weekly expenses for bar chart
  const weekIntervals = eachWeekOfInterval(
    { start: new Date(startDate), end: new Date(endDate) },
    { weekStartsOn: 1 } // Monday
  );

  const weeklyData = weekIntervals.map((weekStart, index) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const weekExpenses = expenses.filter(expense => {
      const expenseDate = new Date(expense.expenseDate);
      return expenseDate >= weekStart && expenseDate <= weekEnd;
    });

    const totalAmount = weekExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const count = weekExpenses.length;

    return {
      week: `Week ${index + 1}`,
      period: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
      amount: totalAmount,
      count,
    };
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
  const totalTransactions = expenses.length;

  // Get period display text
  const getPeriodText = () => {
    if (filterType === 'alltime') return 'All Time';
    if (filterType === 'last3months') return 'Last 3 Months';
    return format(monthDate, 'MMMM yyyy');
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            Amount: <span className="font-bold text-purple-600">₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </p>
          {payload[0].payload.count && (
            <p className="text-xs text-gray-500">
              Transactions: {payload[0].payload.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Analytics</h1>
            <p className="text-gray-600 mt-1">{branchName} - Visual expense insights</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setFilterType('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === 'month'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('last3months')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filterType === 'last3months'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 3 Months
          </button>
          <button
            onClick={() => setFilterType('alltime')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
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
              <Calendar className="w-5 h-5 text-gray-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                max={format(new Date(), 'yyyy-MM')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Period display for other filters */}
          {filterType !== 'month' && (
            <div className="flex items-center gap-2 ml-auto text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">{getPeriodText()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{totalExpenses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {getPeriodText()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{totalTransactions}</p>
              <p className="text-sm text-gray-500 mt-1">
                {categoryData.length} categories
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Average Expense</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{averageExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Per transaction
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <PieChartIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <PieChartIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-600">
            There are no expenses recorded for {getPeriodText()}.
          </p>
        </div>
      ) : (
        <>
          {/* Category-wise Pie Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Category-wise Spending</h2>
              <p className="text-sm text-gray-600 mt-1">Distribution of expenses by category</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {categoryData.map((category, index) => (
                  <div key={category.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{category.name}</p>
                        <p className="text-xs text-gray-500">{category.count} transactions</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{category.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Trend Line Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Daily Expense Trend</h2>
              <p className="text-sm text-gray-600 mt-1">Daily spending pattern throughout the month</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={completeDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={Math.floor(completeDaily.length / 10)}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Amount (₹)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Weekly Analysis</h2>
              <p className="text-sm text-gray-600 mt-1">Week-wise expense breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="text-sm font-semibold text-gray-900">{payload[0].payload.week}</p>
                          <p className="text-xs text-gray-600 mb-1">{payload[0].payload.period}</p>
                          <p className="text-sm text-gray-600">
                            Amount: <span className="font-bold text-purple-600">₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            Transactions: {payload[0].payload.count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="amount" fill="#8B5CF6" name="Amount (₹)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
