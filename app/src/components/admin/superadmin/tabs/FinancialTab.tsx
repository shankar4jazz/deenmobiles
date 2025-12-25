import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';

interface FinancialTabProps {
  branchId: string;
  dateRange: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
}

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

export default function FinancialTab({ branchId, dateRange }: FinancialTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['branchFinancial', branchId, dateRange],
    queryFn: () => dashboardApi.getBranchFinancialReport(branchId, dateRange),
    enabled: !!branchId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { revenue, expenses, profit, pettyCash } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">
                ₹{revenue.total.toLocaleString()}
              </p>
              <p className="text-purple-100 text-xs mt-1">
                {revenue.count} transactions
              </p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold mt-1">
                ₹{expenses.total.toLocaleString()}
              </p>
              <p className="text-red-100 text-xs mt-1">
                {expenses.count} entries
              </p>
            </div>
            <TrendingDown className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-lg p-6 text-white ${
          profit.total >= 0
            ? 'from-green-500 to-green-600'
            : 'from-orange-500 to-orange-600'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Net Profit</p>
              <p className="text-2xl font-bold mt-1">
                ₹{Math.abs(profit.total).toLocaleString()}
              </p>
              <p className="text-white/80 text-xs mt-1">
                {profit.margin}% margin
              </p>
            </div>
            <DollarSign className="w-10 h-10 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">Petty Cash Balance</p>
              <p className="text-2xl font-bold mt-1">
                ₹{pettyCash.balance.toLocaleString()}
              </p>
              <p className="text-cyan-100 text-xs mt-1">
                ₹{pettyCash.spent} spent
              </p>
            </div>
            <Wallet className="w-10 h-10 opacity-80" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenue.trend}>
              <XAxis
                dataKey="date"
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenses.byCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="amount"
              >
                {expenses.byCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Revenue by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenue.byStatus}>
              <XAxis dataKey="status" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="amount" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Details Table */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {expenses.byCategory.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div>
                    <div className="font-medium text-gray-900">{category.name}</div>
                    <div className="text-xs text-gray-500">{category.count} entries</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ₹{category.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg: ₹{category.average.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
