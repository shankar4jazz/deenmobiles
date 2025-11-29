import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, DollarSign, Package, Wrench, Users } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import FinancialTab from './tabs/FinancialTab';
import InventoryTab from './tabs/InventoryTab';
import OperationsTab from './tabs/OperationsTab';
import CustomerTab from './tabs/CustomerTab';

interface BranchDetailedViewProps {
  branchId: string;
  dateRange: {
    startDate?: string;
    endDate?: string;
    period?: string;
  };
  onBack: () => void;
}

type TabType = 'overview' | 'financial' | 'inventory' | 'operations' | 'customers';

export default function BranchDetailedView({
  branchId,
  dateRange,
  onBack,
}: BranchDetailedViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch branch analytics
  const { data, isLoading } = useQuery({
    queryKey: ['branchAnalytics', branchId, dateRange],
    queryFn: () => dashboardApi.getBranchAnalytics(branchId, dateRange),
    enabled: !!branchId,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const { branch, financial, inventory, operations, customers } = data;

  const tabs = [
    { id: 'overview' as const, name: 'Overview', icon: Building2 },
    { id: 'financial' as const, name: 'Financial', icon: DollarSign },
    { id: 'inventory' as const, name: 'Inventory', icon: Package },
    { id: 'operations' as const, name: 'Operations', icon: Wrench },
    { id: 'customers' as const, name: 'Customers', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{branch.name}</h2>
          <p className="text-sm text-gray-600">
            {branch.code} • {branch.manager?.name || 'No Manager'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 font-medium">Total Customers</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {branch.totalCustomers}
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 font-medium">Total Services</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {branch.totalServices}
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-sm text-purple-600 font-medium">Staff Members</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {branch.totalEmployees}
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-sm text-orange-600 font-medium">Inventory Items</div>
                  <div className="text-2xl font-bold text-orange-900 mt-1">
                    {branch.totalItems}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-medium">Revenue</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{financial.revenue.total.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-medium">Expenses</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{financial.expenses.total.toLocaleString()}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-600 font-medium">Profit</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    financial.profit.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{Math.abs(financial.profit.total).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Margin: {financial.profit.margin}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <FinancialTab branchId={branchId} dateRange={dateRange} />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab branchId={branchId} />
          )}

          {activeTab === 'operations' && (
            <OperationsTab branchId={branchId} dateRange={dateRange} />
          )}

          {activeTab === 'customers' && (
            <CustomerTab branchId={branchId} dateRange={dateRange} />
          )}
        </div>
      </div>
    </div>
  );
}
