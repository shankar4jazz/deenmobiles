import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Building2, Users, IndianRupee, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import StatCard from '@/components/dashboard/StatCard';
import AllBranchesView from '@/components/admin/superadmin/AllBranchesView';
import BranchDetailedView from '@/components/admin/superadmin/BranchDetailedView';
import DateRangePicker from '@/components/admin/superadmin/DateRangePicker';

export default function SuperAdminDashboard() {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
    period?: string;
  }>({ period: 'month' });

  // Fetch super admin dashboard data
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['superAdminDashboard', dateRange],
    queryFn: () => dashboardApi.getSuperAdminDashboard(dateRange),
    refetchInterval: 60000, // Refetch every minute
  });

  const handleDateRangeChange = (newRange: typeof dateRange) => {
    setDateRange(newRange);
  };

  const handleBranchSelect = (branchId: string | null) => {
    setSelectedBranchId(branchId);
  };

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { summary, branches } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Company-wide analytics and branch performance
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Branches"
          value={summary.totalBranches}
          icon={Building2}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total Customers"
          value={summary.totalCustomers}
          icon={Users}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          iconColor="text-cyan-600"
          iconBg="bg-cyan-100"
        />
        <StatCard
          title="Total Inventory"
          value={summary.totalInventoryItems}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
      </div>

      {/* Financial Overview */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{summary.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ₹{summary.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Profit</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              ₹{summary.totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {selectedBranchId ? (
        <BranchDetailedView
          branchId={selectedBranchId}
          dateRange={dateRange}
          onBack={() => setSelectedBranchId(null)}
        />
      ) : (
        <AllBranchesView
          branches={branches}
          onBranchSelect={handleBranchSelect}
        />
      )}
    </div>
  );
}
