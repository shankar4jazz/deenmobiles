import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Settings } from 'lucide-react';
import ThemeList from '../themes/ThemeList';
import JobSheetTemplateList from '../jobsheet-templates/JobSheetTemplateList';

interface Tab {
  id: string;
  label: string;
  icon: typeof FileText;
  component: JSX.Element;
}

export default function SettingsMainPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'invoice';

  const tabs: Tab[] = [
    {
      id: 'invoice',
      label: 'Invoice',
      icon: FileText,
      component: <ThemeList />,
    },
    {
      id: 'estimate',
      label: 'Estimate',
      icon: FileText,
      component: <ThemeList />,
    },
    {
      id: 'job-sheet',
      label: 'Job Sheet',
      icon: FileText,
      component: <JobSheetTemplateList />,
    },
  ];

  const activeTab = tabs.find((tab) => tab.id === activeTabParam) || tabs[0];

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7" />
            Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Manage templates for invoices, estimates, and job sheets
          </p>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab.id === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium text-sm whitespace-nowrap
                  border-b-2 transition-colors
                  ${
                    isActive
                      ? 'border-purple-600 text-purple-600 bg-purple-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab.component}
        </div>
      </div>
    </div>
  );
}
