import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Send, Clock, FileText } from 'lucide-react';
import PettyCashDashboard from './PettyCashDashboard';
import RequestPettyCashPage from './RequestPettyCashPage';
import MyPettyCashRequestsPage from './MyPettyCashRequestsPage';
import PettyCashTransferHistoryPage from './PettyCashTransferHistoryPage';

type TabType = 'dashboard' | 'request' | 'requests' | 'transfers';

interface Tab {
  id: TabType;
  label: string;
  icon: any;
}

const tabs: Tab[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'request', label: 'Request Cash', icon: Send },
  { id: 'requests', label: 'My Requests', icon: Clock },
  { id: 'transfers', label: 'Transfer History', icon: FileText },
];

export default function PettyCashMainPage() {
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
        return <PettyCashDashboard />;
      case 'request':
        return <RequestPettyCashPage />;
      case 'requests':
        return <MyPettyCashRequestsPage />;
      case 'transfers':
        return <PettyCashTransferHistoryPage />;
      default:
        return <PettyCashDashboard />;
    }
  };

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Petty Cash Management</h1>
        <p className="text-gray-600 mt-1">Manage requests, transfers, and track petty cash</p>
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
