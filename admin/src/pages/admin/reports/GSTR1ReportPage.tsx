import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Loader2, FileSpreadsheet, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { branchApi } from '@/services/branchApi';
import { gstr1Api, type GSTR1Filters, type GSTR1Report } from '@/services/gstr1Api';
import { getPlaceOfSupplyDisplay, MONTH_NAMES, getFilingPeriod } from '@/constants/gst';

type GSTR1Tab = 'summary' | 'b2b' | 'b2c-large' | 'b2c-small' | 'hsn' | 'documents';

const gstr1Tabs: { id: GSTR1Tab; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'b2b', label: 'B2B' },
  { id: 'b2c-large', label: 'B2C Large' },
  { id: 'b2c-small', label: 'B2C Small' },
  { id: 'hsn', label: 'HSN Summary' },
  { id: 'documents', label: 'Documents' },
];

export default function GSTR1ReportPage() {
  const user = useAuthStore((state) => state.user);
  const today = new Date();

  const [activeTab, setActiveTab] = useState<GSTR1Tab>('summary');
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>(
    user?.branchId || undefined
  );

  const canSelectBranch = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getBranches(),
    enabled: canSelectBranch,
  });

  const filters: GSTR1Filters = {
    month: selectedMonth,
    year: selectedYear,
    branchId: selectedBranchId,
  };

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['gstr1-report', filters],
    queryFn: () => gstr1Api.getFullReport(filters),
  });

  const handleExportExcel = async () => {
    try {
      const blob = await gstr1Api.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GSTR1_${selectedMonth.toString().padStart(2, '0')}_${selectedYear}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderSummaryTab = (data: GSTR1Report) => {
    const { summary } = data;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">Total Invoices</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalInvoices}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">B2B Invoices</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{summary.b2bCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">B2C Large</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">{summary.b2cLargeCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase">B2C Small</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{summary.b2cSmallCount}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 col-span-2">
            <p className="text-xs text-gray-500 uppercase">Period</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{getFilingPeriod(selectedMonth, selectedYear)}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Tax Summary</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Taxable Value</p>
                <p className="text-xl font-bold text-blue-800">{formatCurrency(summary.totalTaxableValue)}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-orange-600 font-medium">Total IGST</p>
                <p className="text-xl font-bold text-orange-800">{formatCurrency(summary.totalIGST)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Total CGST</p>
                <p className="text-xl font-bold text-green-800">{formatCurrency(summary.totalCGST)}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Total SGST</p>
                <p className="text-xl font-bold text-purple-800">{formatCurrency(summary.totalSGST)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Total Cess</p>
                <p className="text-xl font-bold text-red-800">{formatCurrency(summary.totalCess)}</p>
              </div>
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Total Tax</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.totalTax)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderB2BTab = (data: GSTR1Report) => {
    if (data.b2b.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No B2B invoices found for this period
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">B2B Invoices ({data.b2b.length})</h3>
          <p className="text-xs text-gray-500">Invoices to registered dealers with GSTIN</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Place</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Taxable</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.b2b.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono text-xs">{record.gstin}</td>
                  <td className="px-3 py-2 font-medium text-purple-600">{record.invoiceNumber}</td>
                  <td className="px-3 py-2 text-gray-500">{formatDate(record.invoiceDate)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(record.invoiceValue)}</td>
                  <td className="px-3 py-2 text-xs">{getPlaceOfSupplyDisplay(record.placeOfSupply)}</td>
                  <td className="px-3 py-2 text-center">{record.rate}%</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(record.taxableValue)}</td>
                  <td className="px-3 py-2 text-right text-orange-600">{formatCurrency(record.igstAmount)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{formatCurrency(record.cgstAmount)}</td>
                  <td className="px-3 py-2 text-right text-purple-600">{formatCurrency(record.sgstAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderB2CLargeTab = (data: GSTR1Report) => {
    if (data.b2cLarge.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No B2C Large invoices found for this period
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">B2C Large ({data.b2cLarge.length})</h3>
          <p className="text-xs text-gray-500">Inter-state sales &gt; Rs. 2.5 Lakhs to unregistered customers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Place of Supply</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.b2cLarge.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{getPlaceOfSupplyDisplay(record.placeOfSupply)}</td>
                  <td className="px-4 py-3 text-center">{record.rate}%</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(record.taxableValue)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(record.igstAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(record.cessAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderB2CSmallTab = (data: GSTR1Report) => {
    if (data.b2cSmall.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No B2C Small invoices found for this period
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">B2C Small ({data.b2cSmall.length})</h3>
          <p className="text-xs text-gray-500">Other B2C (Intra-state or Inter-state &lt;= Rs. 2.5 Lakhs)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Place of Supply</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Taxable Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cess</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.b2cSmall.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{record.type}</td>
                  <td className="px-4 py-3">{getPlaceOfSupplyDisplay(record.placeOfSupply)}</td>
                  <td className="px-4 py-3 text-center">{record.rate}%</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(record.taxableValue)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(record.cgstAmount)}</td>
                  <td className="px-4 py-3 text-right text-purple-600">{formatCurrency(record.sgstAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{formatCurrency(record.igstAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(record.cessAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderHSNTab = (data: GSTR1Report) => {
    if (data.hsnSummary.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No HSN data found for this period
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">HSN Summary ({data.hsnSummary.length})</h3>
          <p className="text-xs text-gray-500">Grouped by HSN/SAC code</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">HSN</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">UQC</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Taxable</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">IGST</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">CGST</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">SGST</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.hsnSummary.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-mono font-medium">{record.hsnCode}</td>
                  <td className="px-3 py-2 text-gray-600 truncate max-w-[200px]">{record.description}</td>
                  <td className="px-3 py-2 text-center">{record.uqc}</td>
                  <td className="px-3 py-2 text-right">{record.totalQuantity}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(record.totalValue)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(record.taxableValue)}</td>
                  <td className="px-3 py-2 text-right text-orange-600">{formatCurrency(record.igstAmount)}</td>
                  <td className="px-3 py-2 text-right text-green-600">{formatCurrency(record.cgstAmount)}</td>
                  <td className="px-3 py-2 text-right text-purple-600">{formatCurrency(record.sgstAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderDocumentsTab = (data: GSTR1Report) => {
    if (data.documentSummary.length === 0) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
          No document summary found for this period
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Document Summary</h3>
          <p className="text-xs text-gray-500">Invoice series tracking</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From No.</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To No.</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cancelled</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Issued</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.documentSummary.map((record, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{record.documentType}</td>
                  <td className="px-4 py-3 font-mono">{record.fromNumber}</td>
                  <td className="px-4 py-3 font-mono">{record.toNumber}</td>
                  <td className="px-4 py-3 text-right">{record.totalCount}</td>
                  <td className="px-4 py-3 text-right text-red-600">{record.cancelledCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{record.netIssued}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!reportData) return null;

    switch (activeTab) {
      case 'summary':
        return renderSummaryTab(reportData);
      case 'b2b':
        return renderB2BTab(reportData);
      case 'b2c-large':
        return renderB2CLargeTab(reportData);
      case 'b2c-small':
        return renderB2CSmallTab(reportData);
      case 'hsn':
        return renderHSNTab(reportData);
      case 'documents':
        return renderDocumentsTab(reportData);
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {MONTH_NAMES.map((month, idx) => (
                    <option key={idx} value={idx + 1}>
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                >
                  {Array.from({ length: 10 }, (_, i) => today.getFullYear() - i).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleNextMonth}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {canSelectBranch && (
              <select
                value={selectedBranchId || ''}
                onChange={(e) => setSelectedBranchId(e.target.value || undefined)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Branches</option>
                {branches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
            >
              Generate Report
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isLoading || !reportData}
              className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <div className="flex">
          {gstr1Tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : (
        renderContent()
      )}
    </div>
  );
}
