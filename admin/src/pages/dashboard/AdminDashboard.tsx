import { useQuery } from '@tanstack/react-query';
import { BarChart3, DollarSign, Clock, Wrench } from 'lucide-react';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Area, AreaChart } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';

import StatCard from '@/components/dashboard/StatCard';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: dashboardApi.getDashboardData,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 90 * 1000, // Refetch every 90 seconds
    refetchOnWindowFocus: true,
  });

  if (isLoading || !data) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </>
    );
  }

  const { stats, servicesChart, statusBreakdown, weeklyTrend, recentActivity } = data;

  // Calculate percentage for circular progress
  const totalStatus = statusBreakdown.reduce((sum, item) => sum + item.value, 0);
  const completedCount = statusBreakdown.find(item => item.name === 'COMPLETED')?.value || 0;
  const completionPercentage = totalStatus > 0 ? Math.round((completedCount / totalStatus) * 100) : 0;

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Services"
          value={stats.totalServices}
          change={stats.totalServicesChange}
          icon={BarChart3}
          iconColor="text-yellow-600"
          iconBg="bg-yellow-100"
        />
        <StatCard
          title="Revenue"
          value={`₹${stats.revenue.toLocaleString()}`}
          change={stats.revenueChange}
          icon={DollarSign}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-100"
        />
        <StatCard
          title="Pending Services"
          value={stats.pendingServices}
          change={stats.pendingServicesChange}
          icon={Clock}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday}
          change={stats.completedTodayChange}
          icon={Wrench}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Market Overview Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Market Overview</h2>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                  <span className="text-gray-600">Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                  <span className="text-gray-600">Goal</span>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={servicesChart}>
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" fill="#22D3EE" radius={[8, 8, 0, 0]} />
                <Bar dataKey="goal" fill="#7C3AED" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Row - Sales Overview and Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales Overview - Circular Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Sales Overview</h3>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative w-40 h-40">
                  {/* Simple circular progress using conic gradient */}
                  <div
                    className="w-full h-full rounded-full"
                    style={{
                      background: `conic-gradient(#7C3AED 0% ${completionPercentage}%, #E0E7FF ${completionPercentage}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-gray-800">{completionPercentage}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <div className="flex items-center gap-2 justify-center mb-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <span className="text-sm font-semibold text-gray-700">System status</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">OPTIMUM</span>
                  <p className="text-xs text-gray-500 mt-2">Lorem ipsum dolor sit amet consectur</p>
                </div>
              </div>
            </div>

            {/* Sales Analytics - Area Chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Sales Analytics</h3>

              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weeklyTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                  />
                </AreaChart>
              </ResponsiveContainer>

              {weeklyTrend.length > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                    {weeklyTrend[weeklyTrend.length - 1].value}
                  </div>
                  <span className="text-xs text-gray-500">Latest value</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <ActivityFeed
            activities={recentActivity}
            title="Today"
            date={format(new Date(), 'do MMM, yyyy')}
          />
        </div>
      </div>
    </>
  );
}
