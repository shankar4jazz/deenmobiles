import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Users,
  Wrench,
  Smartphone,
  AlertCircle,
  Calendar,
  CalendarDays,
  Wallet,
  Download,
  Loader2,
  ChevronDown,
  IndianRupee,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { branchApi } from '../../services/branchApi';
import { reportApi, type ReportFilters, type DateFilter, type MonthFilter } from '../../services/reportApi';

type ReportType = 'booking-person' | 'technician' | 'brand' | 'fault' | 'daily-transaction' | 'monthly-transaction' | 'cash-settlement';

const reportTabs: { id: ReportType; label: string; icon: React.ReactNode }[] = [
  { id: 'booking-person', label: 'Booking Person', icon: <Users className="w-4 h-4" /> },
  { id: 'technician', label: 'Technician', icon: <Wrench className="w-4 h-4" /> },
  { id: 'brand', label: 'Brand', icon: <Smartphone className="w-4 h-4" /> },
  { id: 'fault', label: 'Fault', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'daily-transaction', label: 'Daily Transaction', icon: <Calendar className="w-4 h-4" /> },
  { id: 'monthly-transaction', label: 'Monthly Transaction', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'cash-settlement', label: 'Cash Settlement', icon: <Wallet className="w-4 h-4" /> },
];

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<ReportType>(
    (searchParams.get('type') as ReportType) || 'booking-person'
  );

  // Date filters
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    user?.branchId || undefined
  );

  const canSelectBranch = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Fetch branches for filter
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getBranches(),
    enabled: canSelectBranch,
  });

  // Build filters based on active tab
  const getFilters = (): ReportFilters | DateFilter | MonthFilter => {
    const branchId = selectedBranchId;

    if (activeTab === 'daily-transaction' || activeTab === 'cash-settlement') {
      return { date: selectedDate, branchId };
    }

    if (activeTab === 'monthly-transaction') {
      return { year: selectedYear, month: selectedMonth, branchId };
    }

    return { startDate, endDate, branchId };
  };

  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['report', activeTab, getFilters()],
    queryFn: async () => {
      const filters = getFilters();
      switch (activeTab) {
        case 'booking-person':
          return reportApi.getBookingPersonReport(filters as ReportFilters);
        case 'technician':
          return reportApi.getTechnicianReport(filters as ReportFilters);
        case 'brand':
          return reportApi.getBrandReport(filters as ReportFilters);
        case 'fault':
          return reportApi.getFaultReport(filters as ReportFilters);
        case 'daily-transaction':
          return reportApi.getDailyTransactionReport(filters as DateFilter);
        case 'monthly-transaction':
          return reportApi.getMonthlyTransactionReport(filters as MonthFilter);
        case 'cash-settlement':
          return reportApi.getDailyCashSettlement(filters as DateFilter);
        default:
          return null;
      }
    },
  });

  const handleTabChange = (tab: ReportType) => {
    setActiveTab(tab);
    setSearchParams({ type: tab });
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!reportData) return;

    try {
      const blob = await reportApi.exportReport({
        reportType: activeTab,
        format,
        reportData,
        title: `${reportTabs.find((t) => t.id === activeTab)?.label} Report`,
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderDateFilters = () => {
    if (activeTab === 'daily-transaction' || activeTab === 'cash-settlement') {
      return (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      );
    }

    if (activeTab === 'monthly-transaction') {
      return (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = today.getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>
    );
  };

  const renderSummaryCards = () => {
    if (!reportData) return null;

    if ('totals' in reportData) {
      const totals = reportData.totals as Record<string, number>;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(totals).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount')
                  ? formatCurrency(value)
                  : value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if ('totalAmount' in reportData) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(reportData.totalAmount)}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Count</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{reportData.paymentCount}</p>
          </div>
          {'byMethod' in reportData && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Payment Methods</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{reportData.byMethod.length}</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  const renderSummaryTable = () => {
    if (!reportData || !('summary' in reportData)) return null;

    const summary = reportData.summary as Record<string, any>[];
    if (summary.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No data found for the selected filters
        </div>
      );
    }

    const headers = Object.keys(summary[0]).filter((k) => !k.toLowerCase().includes('id'));

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {header.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summary.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  {headers.map((header) => (
                    <td key={header} className="px-4 py-3 text-sm text-gray-900">
                      {header.toLowerCase().includes('revenue') || header.toLowerCase().includes('amount') || header.toLowerCase().includes('avg')
                        ? formatCurrency(item[header])
                        : header.toLowerCase().includes('time') && item[header]
                        ? `${item[header].toFixed(1)} hrs`
                        : item[header]?.toLocaleString() ?? '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPaymentMethodBreakdown = () => {
    if (!reportData || !('byMethod' in reportData)) return null;

    const byMethod = reportData.byMethod;
    if (byMethod.length === 0) return null;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">By Payment Method</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byMethod.map((method: any) => (
              <div
                key={method.paymentMethodId || method.methodId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{method.paymentMethodName || method.methodName}</p>
                  <p className="text-sm text-gray-500">
                    {method.count} transaction{method.count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  {'openingBalance' in method ? (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">Opening: {formatCurrency(method.openingBalance)}</p>
                      <p className="text-xs text-green-600">+{formatCurrency(method.receivedAmount)}</p>
                      <p className="text-sm font-bold text-gray-900">= {formatCurrency(method.closingBalance)}</p>
                    </div>
                  ) : (
                    <p className="font-bold text-green-600">{formatCurrency(method.amount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTransactionsTable = () => {
    if (!reportData || !('transactions' in reportData)) return null;

    const transactions = reportData.transactions;
    if (transactions.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No transactions found
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Transactions ({transactions.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx: any, idx: number) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-purple-600">{tx.ticketNumber || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.customerName || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{tx.paymentMethodName}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(tx.paymentDate).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-sm text-gray-500">Generate and export reports</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('excel')}
              disabled={isLoading || !reportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              disabled={isLoading || !reportData}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-x-auto">
          <div className="flex">
            {reportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {renderDateFilters()}

            {canSelectBranch && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Branch:</label>
                <select
                  value={selectedBranchId || ''}
                  onChange={(e) => setSelectedBranchId(e.target.value || undefined)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Branches</option>
                  {branches.map((branch: any) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => refetch()}
              className="ml-auto px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <>
            {renderSummaryCards()}
            {renderSummaryTable()}
            {renderPaymentMethodBreakdown()}
            {renderTransactionsTable()}
          </>
        )}
      </div>
    </div>
  );
}
