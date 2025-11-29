import { useQuery } from '@tanstack/react-query';
import { Users, TrendingUp, UserPlus, Award } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';

interface CustomerTabProps {
  branchId: string;
  dateRange: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
}

export default function CustomerTab({ branchId, dateRange }: CustomerTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['branchCustomers', branchId, dateRange],
    queryFn: () => dashboardApi.getBranchCustomerReport(branchId, dateRange),
    enabled: !!branchId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { summary, growth, topCustomers, retention } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Customers</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {summary.total}
              </p>
            </div>
            <Users className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">New Customers</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {summary.new}
              </p>
              <p className="text-xs text-green-600 mt-1">
                +{summary.growthRate}% this period
              </p>
            </div>
            <UserPlus className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Retention Rate</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {retention.rate}%
              </p>
            </div>
            <Award className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-cyan-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-600 text-sm font-medium">Active Customers</p>
              <p className="text-2xl font-bold text-cyan-900 mt-1">
                {summary.active}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-cyan-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Growth Trend */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Growth Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growth.trend}>
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
                dataKey="count"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Service Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Customer Service Distribution</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">No Services</span>
              <span className="text-lg font-bold text-gray-900">
                {summary.withoutServices}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-700">1 Service</span>
              <span className="text-lg font-bold text-blue-900">
                {summary.withOneService}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-700">Multiple Services</span>
              <span className="text-lg font-bold text-purple-900">
                {summary.withMultipleServices}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="space-y-3">
          {topCustomers.map((customer: any, index: number) => (
            <div
              key={customer.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0
                    ? 'bg-yellow-500'
                    : index === 1
                    ? 'bg-gray-400'
                    : index === 2
                    ? 'bg-orange-400'
                    : 'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.email}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  ₹{customer.totalRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {customer.serviceCount} services
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Retention Metrics */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Retention Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm font-medium text-purple-700">Returning Customers</p>
            <p className="text-3xl font-bold text-purple-900 mt-2">
              {retention.returning}
            </p>
            <p className="text-xs text-purple-600 mt-1">
              Out of {summary.total} total
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-700">Avg. Service Interval</p>
            <p className="text-3xl font-bold text-green-900 mt-2">
              {retention.avgServiceInterval}
            </p>
            <p className="text-xs text-green-600 mt-1">Days between services</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Lifetime Value</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">
              ₹{retention.avgLifetimeValue.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 mt-1">Average per customer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
