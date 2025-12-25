import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BranchEmployeesModal from '@/components/branches/BranchEmployeesModal';
import { useAuthStore } from '@/store/authStore';
import { branchApi } from '@/services/branchApi';
import { dashboardApi } from '@/services/dashboardApi';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Users,
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Calendar,
  DollarSign,
  Activity,
  UserCheck,
  AlertCircle,
} from 'lucide-react';

export default function BranchDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);

  // Fetch branch details
  const { data: branchData, isLoading: isLoadingBranch } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchApi.getBranchById(id!),
    enabled: !!id,
  });

  // Fetch dashboard data for the branch
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard', id],
    queryFn: dashboardApi.getDashboardData,
  });

  const isLoading = isLoadingBranch || isLoadingDashboard;

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </>
    );
  }

  if (!branchData) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Branch Not Found</h2>
            <p className="text-gray-600 mt-2">The branch you're looking for doesn't exist.</p>
            <button
              onClick={() => navigate('/admin/branches')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Back to Branches
            </button>
          </div>
        </div>
      </>
    );
  }

  const stats = dashboardData?.stats || {
    totalServices: 0,
    pendingServices: 0,
    completedToday: 0,
    revenue: 0,
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/branches')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Branch Dashboard</h1>
            <p className="text-gray-600">Detailed analytics and performance metrics</p>
          </div>
        </div>

        {/* Branch Header Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-xl p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{branchData.name}</h2>
                <p className="text-purple-100 mb-3">Code: {branchData.code}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{branchData.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{branchData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{branchData.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  branchData.isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}
              >
                {branchData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Manager Information */}
        {branchData.manager && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <UserCheck className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Branch Manager</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{branchData.manager.name}</p>
                <p className="text-sm text-gray-600">{branchData.manager.email}</p>
                <span className="inline-block mt-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                  {branchData.manager.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Services */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Wrench className="h-6 w-6 text-blue-600" />
              </div>
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Services</h3>
            <p className="text-3xl font-bold text-gray-900">{branchData._count?.services || 0}</p>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </div>

          {/* Pending Services */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.pendingServices}</p>
            <p className="text-xs text-gray-500 mt-1">Needs attention</p>
          </div>

          {/* Completed Today */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Completed Today</h3>
            <p className="text-3xl font-bold text-gray-900">{stats.completedToday}</p>
            <p className="text-xs text-gray-500 mt-1">Today's performance</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Revenue</h3>
            <p className="text-3xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Total earnings</p>
          </div>
        </div>

        {/* Staff and Customer Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Staff */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Staff Members</h3>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <p className="text-4xl font-bold text-blue-600">{branchData._count?.users || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Total employees</p>
            </div>
          </div>

          {/* Total Customers */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <p className="text-4xl font-bold text-green-600">{branchData._count?.customers || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Registered customers</p>
            </div>
          </div>

          {/* Services Count */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wrench className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Services</h3>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <p className="text-4xl font-bold text-purple-600">{branchData._count?.services || 0}</p>
              <p className="text-sm text-gray-600 mt-2">Total services</p>
            </div>
          </div>
        </div>

        {/* Staff List */}
        {branchData.users && branchData.users.length > 0 && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Branch Staff</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branchData.users.map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {staff.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{staff.email}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            staff.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate(`/branches/edit/${id}`)}
              className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
            >
              <Building2 className="h-6 w-6 text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Edit Branch</p>
            </button>
            <button
              onClick={() => setShowEmployeesModal(true)}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Manage Staff</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left">
              <Wrench className="h-6 w-6 text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Services</p>
            </button>
            <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left">
              <TrendingUp className="h-6 w-6 text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
          </div>
        </div>
      </div>

      {/* Employee Management Modal */}
      {id && (
        <BranchEmployeesModal
          branchId={id}
          isOpen={showEmployeesModal}
          onClose={() => setShowEmployeesModal(false)}
        />
      )}
    </>
  );
}
