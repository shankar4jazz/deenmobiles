import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { branchApi } from '@/services/branchApi';
import { dashboardApi } from '@/services/dashboardApi';
import BranchEmployeesModal from '@/components/branches/BranchEmployeesModal';
import {
  Users,
  Wrench,
  TrendingUp,
  Clock,
  CheckCircle2,
  DollarSign,
  Activity,
  UserCheck,
  AlertCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Wallet,
  ChevronRight,
} from 'lucide-react';

export default function ManagerBranchDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);

  // Use the active branch ID from global auth store
  const branchId = user?.activeBranch?.id;

  // Fetch branch details
  const { data: branchData, isLoading: isLoadingBranch } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchApi.getBranchById(branchId!),
    enabled: !!branchId,
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ['dashboard', branchId],
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Branch Not Found</h2>
            <p className="text-gray-600 mt-2">You are not assigned to any branch.</p>
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
      <div className="space-y-4">
        {/* Welcome Section */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 text-sm">
            Here's what's happening with your branch today
          </p>
        </div>

        {/* Branch Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg p-4 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold mb-0.5">{branchData.name}</h2>
              <p className="text-purple-100 text-sm mb-2">Branch Code: {branchData.code}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-xs">{branchData.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="text-xs">{branchData.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="text-xs">{branchData.email}</span>
                </div>
              </div>
            </div>
            <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
              Active Branch
            </span>
          </div>
        </div>

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Services */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => navigate('/branch/services')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <Activity className="h-4 w-4 text-gray-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1">Total Services</h3>
            <p className="text-2xl font-bold text-gray-900">{branchData._count?.services || 0}</p>
          </div>

          {/* Pending Services */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => navigate('/branch/services')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <AlertCircle className="h-4 w-4 text-orange-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1">Pending</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingServices}</p>
          </div>

          {/* Completed Today */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => navigate('/branch/services')}>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <Calendar className="h-4 w-4 text-green-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1">Completed Today</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.completedToday}</p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            <h3 className="text-gray-600 text-xs font-medium mb-1">Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">₹{stats.revenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Quick Reports */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h3 className="text-sm font-semibold text-gray-900">Quick Reports</h3>
            </div>
            <button
              onClick={() => navigate('/branch/reports')}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/branch/reports?type=daily-transaction')}
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
            >
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-900">Daily Transactions</span>
            </button>
            <button
              onClick={() => navigate('/branch/reports?type=cash-settlement')}
              className="flex items-center gap-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
            >
              <Wallet className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-gray-900">Cash Settlement</span>
            </button>
            <button
              onClick={() => navigate('/branch/reports?type=booking-person')}
              className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
            >
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-gray-900">Booking Report</span>
            </button>
            <button
              onClick={() => navigate('/branch/reports?type=technician')}
              className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
            >
              <Wrench className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-medium text-gray-900">Technician Report</span>
            </button>
          </div>
        </div>

        {/* Branch Statistics */}
        <div className="grid grid-cols-3 gap-4">
          {/* Staff Members */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 rounded">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Staff Members</h3>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                 onClick={() => setShowEmployeesModal(true)}>
              <p className="text-3xl font-bold text-blue-600">{branchData._count?.users || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Total employees</p>
            </div>
          </div>

          {/* Customers */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Customers</h3>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{branchData._count?.customers || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Registered customers</p>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 rounded">
                <Wrench className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Services</h3>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors"
                 onClick={() => navigate('/branch/services')}>
              <p className="text-3xl font-bold text-purple-600">{branchData._count?.services || 0}</p>
              <p className="text-xs text-gray-600 mt-1">Total services</p>
            </div>
          </div>
        </div>

        {/* Staff List */}
        {branchData.users && branchData.users.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Branch Staff</h3>
              </div>
              <button
                onClick={() => setShowEmployeesModal(true)}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs font-medium"
              >
                Manage Staff
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Role
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {branchData.users.slice(0, 5).map((staff) => (
                    <tr key={staff.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs font-medium text-gray-900">
                        {staff.name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{staff.email}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {staff.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs">
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-xs ${
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
              {branchData.users.length > 5 && (
                <div className="text-center py-2 border-t border-gray-200">
                  <button
                    onClick={() => setShowEmployeesModal(true)}
                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                  >
                    View all {branchData.users.length} employees →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Employee Management Modal */}
      {branchId && (
        <BranchEmployeesModal
          branchId={branchId}
          isOpen={showEmployeesModal}
          onClose={() => setShowEmployeesModal(false)}
        />
      )}
    </>
  );
}
