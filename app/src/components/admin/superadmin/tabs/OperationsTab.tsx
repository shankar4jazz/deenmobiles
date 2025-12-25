import { useQuery } from '@tanstack/react-query';
import { Wrench, Users, Clock, CheckCircle, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { dashboardApi } from '@/services/dashboardApi';

interface OperationsTabProps {
  branchId: string;
  dateRange: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#EAB308',
  IN_PROGRESS: '#3B82F6',
  COMPLETED: '#10B981',
  DELIVERED: '#8B5CF6',
  CANCELLED: '#EF4444',
};

export default function OperationsTab({ branchId, dateRange }: OperationsTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['branchOperations', branchId, dateRange],
    queryFn: () => dashboardApi.getBranchOperationsReport(branchId, dateRange),
    enabled: !!branchId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { services, staff, performance } = data;

  return (
    <div className="space-y-6">
      {/* Service Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Services</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {services.total}
              </p>
            </div>
            <Wrench className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mt-1">
                {services.pending}
              </p>
            </div>
            <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Completed</p>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {services.completed}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">
                {services.completionRate}%
              </p>
            </div>
            <Award className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status Distribution */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Service Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={services.byStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {services.byStatus.map((entry: any) => (
                  <Cell
                    key={`cell-${entry.status}`}
                    fill={STATUS_COLORS[entry.status] || '#94A3B8'}
                  />
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

        {/* Average Completion Time */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Average Completion Time</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Avg. Time per Service</span>
              <span className="text-2xl font-bold text-blue-600">
                {performance.avgCompletionTime}h
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">On-Time Completion</span>
              <span className="text-2xl font-bold text-green-600">
                {performance.onTimeRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">Customer Satisfaction</span>
              <span className="text-2xl font-bold text-purple-600">
                {performance.satisfactionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Top Performing Staff</h3>
        <div className="space-y-3">
          {staff.topPerformers.map((member: any, index: number) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
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
                </div>
                <div>
                  <div className="font-medium text-gray-900">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.role}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {member.completedServices} services
                </div>
                <div className="text-sm text-green-600">
                  {member.completionRate}% completion
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Type Distribution */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Service Type Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={services.byType}>
            <XAxis dataKey="type" stroke="#9CA3AF" fontSize={12} />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
