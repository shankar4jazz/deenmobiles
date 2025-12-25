import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { cashSettlementApi, CashSettlement, CashSettlementStatus, UpdateDenominationsDto } from '../../services/cashSettlementApi';
import { format } from 'date-fns';
import {
  Banknote,
  Coins,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  History,
  AlertTriangle,
  RefreshCw,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'today' | 'history';

const DENOMINATION_VALUES = {
  note2000: 2000,
  note500: 500,
  note200: 200,
  note100: 100,
  note50: 50,
  note20: 20,
  note10: 10,
  coin5: 5,
  coin2: 2,
  coin1: 1,
};

const STATUS_CONFIG: Record<CashSettlementStatus, { label: string; color: string; icon: typeof Clock; bg: string }> = {
  PENDING: { label: 'Pending', color: 'text-yellow-700', icon: Clock, bg: 'bg-yellow-100' },
  SUBMITTED: { label: 'Submitted', color: 'text-blue-700', icon: Send, bg: 'bg-blue-100' },
  VERIFIED: { label: 'Verified', color: 'text-green-700', icon: CheckCircle, bg: 'bg-green-100' },
  REJECTED: { label: 'Rejected', color: 'text-red-700', icon: XCircle, bg: 'bg-red-100' },
};

export default function CashSettlementPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';
  const canVerify = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [viewMode, setViewMode] = useState<ViewMode>('today');
  const [denominations, setDenominations] = useState<UpdateDenominationsDto>({
    note2000Count: 0,
    note500Count: 0,
    note200Count: 0,
    note100Count: 0,
    note50Count: 0,
    note20Count: 0,
    note10Count: 0,
    coin5Count: 0,
    coin2Count: 0,
    coin1Count: 0,
  });
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Fetch today's settlement
  const { data: settlement, isLoading, error, refetch } = useQuery({
    queryKey: ['cashSettlement', 'today', branchId],
    queryFn: () => cashSettlementApi.createOrGet({ branchId: branchId! }),
    enabled: !!branchId && viewMode === 'today',
    staleTime: 30000,
  });

  // Fetch settlement history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['cashSettlements', 'history', branchId],
    queryFn: () => cashSettlementApi.getAll({ branchId, limit: 50 }),
    enabled: !!branchId && viewMode === 'history',
  });

  // Update denominations when settlement data changes
  useEffect(() => {
    if (settlement?.denominations) {
      setDenominations({
        note2000Count: settlement.denominations.note2000Count,
        note500Count: settlement.denominations.note500Count,
        note200Count: settlement.denominations.note200Count,
        note100Count: settlement.denominations.note100Count,
        note50Count: settlement.denominations.note50Count,
        note20Count: settlement.denominations.note20Count,
        note10Count: settlement.denominations.note10Count,
        coin5Count: settlement.denominations.coin5Count,
        coin2Count: settlement.denominations.coin2Count,
        coin1Count: settlement.denominations.coin1Count,
      });
    }
    if (settlement?.notes) {
      setNotes(settlement.notes);
    }
  }, [settlement]);

  // Calculate physical cash total
  const physicalCashTotal = useMemo(() => {
    return (
      (denominations.note2000Count || 0) * DENOMINATION_VALUES.note2000 +
      (denominations.note500Count || 0) * DENOMINATION_VALUES.note500 +
      (denominations.note200Count || 0) * DENOMINATION_VALUES.note200 +
      (denominations.note100Count || 0) * DENOMINATION_VALUES.note100 +
      (denominations.note50Count || 0) * DENOMINATION_VALUES.note50 +
      (denominations.note20Count || 0) * DENOMINATION_VALUES.note20 +
      (denominations.note10Count || 0) * DENOMINATION_VALUES.note10 +
      (denominations.coin5Count || 0) * DENOMINATION_VALUES.coin5 +
      (denominations.coin2Count || 0) * DENOMINATION_VALUES.coin2 +
      (denominations.coin1Count || 0) * DENOMINATION_VALUES.coin1
    );
  }, [denominations]);

  // Mutations
  const updateDenominationsMutation = useMutation({
    mutationFn: (data: UpdateDenominationsDto) =>
      cashSettlementApi.updateDenominations(settlement!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSettlement'] });
      toast.success('Denominations saved');
    },
    onError: () => toast.error('Failed to save denominations'),
  });

  const updateNotesMutation = useMutation({
    mutationFn: (notesText: string) =>
      cashSettlementApi.updateNotes(settlement!.id, { notes: notesText }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSettlement'] });
      toast.success('Notes saved');
    },
    onError: () => toast.error('Failed to save notes'),
  });

  const submitMutation = useMutation({
    mutationFn: () => cashSettlementApi.submit(settlement!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSettlement'] });
      toast.success('Settlement submitted for verification');
    },
    onError: () => toast.error('Failed to submit settlement'),
  });

  const verifyMutation = useMutation({
    mutationFn: () => cashSettlementApi.verify(settlement!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSettlement'] });
      toast.success('Settlement verified');
    },
    onError: () => toast.error('Failed to verify settlement'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => cashSettlementApi.reject(settlement!.id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashSettlement'] });
      setShowRejectModal(false);
      setRejectReason('');
      toast.success('Settlement rejected');
    },
    onError: () => toast.error('Failed to reject settlement'),
  });

  const handleDenominationChange = (key: keyof UpdateDenominationsDto, value: string) => {
    const numValue = parseInt(value) || 0;
    setDenominations((prev) => ({ ...prev, [key]: Math.max(0, numValue) }));
  };

  const handleSaveDenominations = () => {
    updateDenominationsMutation.mutate(denominations);
  };

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notes);
  };

  const handleSubmit = () => {
    if (physicalCashTotal === 0) {
      toast.error('Please enter cash denominations before submitting');
      return;
    }
    submitMutation.mutate();
  };

  const handleVerify = () => {
    verifyMutation.mutate();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate(rejectReason);
  };

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  if (isLoading && viewMode === 'today') {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (error && viewMode === 'today') {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading settlement data. Please try again.</p>
        </div>
      </div>
    );
  }

  const isEditable = settlement?.status === 'PENDING' || settlement?.status === 'REJECTED';
  const canSubmit = settlement?.status === 'PENDING' || settlement?.status === 'REJECTED';
  const canVerifyReject = settlement?.status === 'SUBMITTED' && canVerify;
  const netCashAmount = Number(settlement?.netCashAmount || 0);
  const cashDifference = physicalCashTotal - netCashAmount;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cash Settlement</h1>
          <p className="text-gray-600 text-sm">{branchName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('today')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'today'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Today
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              viewMode === 'history'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {viewMode === 'today' && settlement && (
        <>
          {/* Settlement Info Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <p className="text-xs text-gray-500">Settlement Number</p>
                <p className="text-lg font-bold text-gray-900">{settlement.settlementNumber}</p>
                <p className="text-sm text-gray-600">{format(new Date(settlement.settlementDate), 'EEEE, dd MMMM yyyy')}</p>
              </div>
              <div className="flex items-center gap-3">
                {settlement.status && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_CONFIG[settlement.status].bg} ${STATUS_CONFIG[settlement.status].color}`}>
                    {(() => {
                      const Icon = STATUS_CONFIG[settlement.status].icon;
                      return <Icon className="w-4 h-4" />;
                    })()}
                    {STATUS_CONFIG[settlement.status].label}
                  </span>
                )}
                <button
                  onClick={() => refetch()}
                  className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Total Collected</p>
                  <p className="text-xl font-bold text-green-800">
                    ₹{Number(settlement.totalCollected).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-green-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">Total Refunds</p>
                  <p className="text-xl font-bold text-red-800">
                    ₹{Number(settlement.totalRefunds).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-red-200 rounded-lg">
                  <TrendingDown className="w-4 h-4 text-red-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Total Expenses</p>
                  <p className="text-xl font-bold text-orange-800">
                    ₹{Number(settlement.totalExpenses).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-orange-200 rounded-lg">
                  <Wallet className="w-4 h-4 text-orange-700" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-blue-700 mb-1">Net Cash</p>
                  <p className="text-xl font-bold text-blue-800">
                    ₹{netCashAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="p-2 bg-blue-200 rounded-lg">
                  <Banknote className="w-4 h-4 text-blue-700" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          {settlement.methodBreakdowns && settlement.methodBreakdowns.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                Payment Method Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {settlement.methodBreakdowns.map((method) => (
                  <div key={method.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 text-sm">{method.paymentMethod.name}</span>
                      <span className="text-xs text-gray-500">{method.transactionCount} txns</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Collected:</span>
                        <span className="font-medium text-green-600">+₹{Number(method.collectedAmount).toLocaleString('en-IN')}</span>
                      </div>
                      {Number(method.refundedAmount) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Refunded:</span>
                          <span className="font-medium text-red-600">-₹{Number(method.refundedAmount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {Number(method.expenseAmount) > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expenses:</span>
                          <span className="font-medium text-orange-600">-₹{Number(method.expenseAmount).toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-gray-200">
                        <span className="text-gray-700 font-medium">Closing:</span>
                        <span className="font-bold text-gray-900">₹{Number(method.closingBalance).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cash Denomination */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-600" />
              Cash Denomination Count
            </h2>

            {/* Notes */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Notes</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {[
                  { key: 'note2000Count', label: '₹2000', value: denominations.note2000Count, multiplier: 2000 },
                  { key: 'note500Count', label: '₹500', value: denominations.note500Count, multiplier: 500 },
                  { key: 'note200Count', label: '₹200', value: denominations.note200Count, multiplier: 200 },
                  { key: 'note100Count', label: '₹100', value: denominations.note100Count, multiplier: 100 },
                  { key: 'note50Count', label: '₹50', value: denominations.note50Count, multiplier: 50 },
                  { key: 'note20Count', label: '₹20', value: denominations.note20Count, multiplier: 20 },
                  { key: 'note10Count', label: '₹10', value: denominations.note10Count, multiplier: 10 },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{item.label}</label>
                    <input
                      type="number"
                      min="0"
                      value={item.value || ''}
                      onChange={(e) => handleDenominationChange(item.key as keyof UpdateDenominationsDto, e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-2 py-1.5 text-center text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{((item.value || 0) * item.multiplier).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Coins */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Coins</p>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 max-w-xs">
                {[
                  { key: 'coin5Count', label: '₹5', value: denominations.coin5Count, multiplier: 5 },
                  { key: 'coin2Count', label: '₹2', value: denominations.coin2Count, multiplier: 2 },
                  { key: 'coin1Count', label: '₹1', value: denominations.coin1Count, multiplier: 1 },
                ].map((item) => (
                  <div key={item.key} className="text-center">
                    <label className="block text-xs font-medium text-gray-700 mb-1">{item.label}</label>
                    <input
                      type="number"
                      min="0"
                      value={item.value || ''}
                      onChange={(e) => handleDenominationChange(item.key as keyof UpdateDenominationsDto, e.target.value)}
                      disabled={!isEditable}
                      className="w-full px-2 py-1.5 text-center text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ₹{((item.value || 0) * item.multiplier).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Physical Cash Total */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-gray-200">
              <div>
                <p className="text-sm font-medium text-gray-700">Physical Cash Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{physicalCashTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${Math.abs(cashDifference) < 1 ? 'bg-green-100' : cashDifference > 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <p className="text-xs font-medium text-gray-600">Difference</p>
                <p className={`text-lg font-bold ${Math.abs(cashDifference) < 1 ? 'text-green-700' : cashDifference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                  {cashDifference >= 0 ? '+' : ''}₹{cashDifference.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Difference Alert */}
            {Math.abs(cashDifference) >= 1 && (
              <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${cashDifference > 0 ? 'bg-blue-50 border border-blue-200' : 'bg-red-50 border border-red-200'}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 ${cashDifference > 0 ? 'text-blue-600' : 'text-red-600'}`} />
                <div>
                  <p className={`text-sm font-medium ${cashDifference > 0 ? 'text-blue-800' : 'text-red-800'}`}>
                    {cashDifference > 0 ? 'Cash Surplus' : 'Cash Shortage'}
                  </p>
                  <p className={`text-xs ${cashDifference > 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    Physical cash is {Math.abs(cashDifference) > 0 ? `₹${Math.abs(cashDifference).toLocaleString('en-IN')}` : ''} {cashDifference > 0 ? 'more' : 'less'} than expected net cash.
                  </p>
                </div>
              </div>
            )}

            {isEditable && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveDenominations}
                  disabled={updateDenominationsMutation.isPending}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateDenominationsMutation.isPending ? 'Saving...' : 'Save Denominations'}
                </button>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900 mb-2">Notes / Remarks</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isEditable}
              placeholder="Add any notes or remarks about this settlement..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 resize-none"
              rows={3}
            />
            {isEditable && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={updateNotesMutation.isPending}
                  className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateNotesMutation.isPending ? 'Saving...' : 'Save Notes'}
                </button>
              </div>
            )}
          </div>

          {/* Rejection Info */}
          {settlement.status === 'REJECTED' && settlement.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Settlement Rejected</p>
                  <p className="text-sm text-red-700 mt-1">{settlement.rejectionReason}</p>
                  {settlement.rejectedBy && (
                    <p className="text-xs text-red-600 mt-1">
                      By {settlement.rejectedBy.firstName} {settlement.rejectedBy.lastName}
                      {settlement.rejectedAt && ` on ${format(new Date(settlement.rejectedAt), 'dd MMM yyyy, hh:mm a')}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verification Info */}
          {settlement.status === 'VERIFIED' && settlement.verifiedBy && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Settlement Verified</p>
                  <p className="text-xs text-green-600 mt-1">
                    By {settlement.verifiedBy.firstName} {settlement.verifiedBy.lastName}
                    {settlement.verifiedAt && ` on ${format(new Date(settlement.verifiedAt), 'dd MMM yyyy, hh:mm a')}`}
                  </p>
                  {settlement.verificationNotes && (
                    <p className="text-sm text-green-700 mt-1">{settlement.verificationNotes}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex flex-wrap justify-end gap-3">
              {canSubmit && (
                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {submitMutation.isPending ? 'Submitting...' : 'Submit for Verification'}
                </button>
              )}
              {canVerifyReject && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="px-6 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending}
                    className="px-6 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {verifyMutation.isPending ? 'Verifying...' : 'Verify Settlement'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Settled By Info */}
          {settlement.settledBy && (
            <div className="text-center text-xs text-gray-500">
              Settlement created by {settlement.settledBy.firstName} {settlement.settledBy.lastName}
            </div>
          )}
        </>
      )}

      {/* History View */}
      {viewMode === 'history' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-sm font-bold text-gray-900">Settlement History</h2>
            <p className="text-xs text-gray-600">Past settlements for {branchName}</p>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : historyData?.settlements && historyData.settlements.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Settlement #</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Cash</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Physical</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diff</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyData.settlements.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{format(new Date(item.settlementDate), 'dd MMM yyyy')}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">{item.settlementNumber}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">₹{Number(item.totalCollected).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-medium text-gray-900">₹{Number(item.netCashAmount).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm text-gray-900">₹{Number(item.physicalCashCount).toLocaleString('en-IN')}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className={`text-sm font-medium ${Number(item.cashDifference) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {Number(item.cashDifference) >= 0 ? '+' : ''}₹{Number(item.cashDifference).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[item.status].bg} ${STATUS_CONFIG[item.status].color}`}>
                          {STATUS_CONFIG[item.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No settlement history found</p>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Settlement</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this settlement.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={4}
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={rejectMutation.isPending || !rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
