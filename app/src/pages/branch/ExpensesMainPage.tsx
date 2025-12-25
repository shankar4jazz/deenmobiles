import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Receipt, History, PieChart } from 'lucide-react';
import ExpenseDashboardPage from './ExpenseDashboardPage';
import RecordExpensePage from './RecordExpensePage';
import ExpenseHistoryPage from './ExpenseHistoryPage';
import ExpenseAnalyticsPage from './ExpenseAnalyticsPage';

type TabType = 'dashboard' | 'record' | 'history' | 'analytics';

interface Tab {
  id: TabType;
  label: string;
  icon: any;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'record', label: 'Record Expense', icon: Receipt },
  { id: 'history', label: 'History', icon: History },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
];

export default function ExpensesMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'dashboard');

  // Sync activeTab with URL params
  useEffect(() => {
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ExpenseDashboardPage />;
      case 'record':
        return <RecordExpensePage />;
      case 'history':
        return <ExpenseHistoryPage />;
      case 'analytics':
        return <ExpenseAnalyticsPage />;
      default:
        return <ExpenseDashboardPage />;
    }
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
        <p className="text-gray-600 mt-1">Track, analyze, and manage branch expenses</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>{renderTabContent()}</div>
    </div>
  );
}
