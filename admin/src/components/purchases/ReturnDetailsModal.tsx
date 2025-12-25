import { X, Calendar, User, FileText, DollarSign, Package, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseItemReturn } from '@/types';

interface ReturnDetailsModalProps {
  returnItem: PurchaseItemReturn;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy');
};

const formatDateTime = (date: string) => {
  return format(new Date(date), 'MMM dd, yyyy hh:mm a');
};

const getReturnReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    DAMAGED: 'Damaged',
    WRONG_ITEM: 'Wrong Item',
    QUALITY_ISSUE: 'Quality Issue',
    EXCESS_STOCK: 'Excess Stock',
    EXPIRED: 'Expired',
    OTHER: 'Other',
  };
  return labels[reason] || reason;
};

const getStatusBadge = (status: string) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Confirmed' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  };
  const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
      {badge.label}
    </span>
  );
};

export default function ReturnDetailsModal({ returnItem, onClose }: ReturnDetailsModalProps) {
  const poItem = returnItem.purchaseOrderItem;
  const po = poItem?.purchaseOrder;
  const itemName = poItem?.item?.itemName || poItem?.inventory?.partName || 'Unknown Item';
  const itemCode = poItem?.item?.itemCode || poItem?.inventory?.partNumber || '-';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Return Details</h2>
              <p className="text-purple-100 text-sm">Return ID: {returnItem.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Return Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Purchase Order Info */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Purchase Order</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">PO Number:</span>
                  <span className="font-medium text-gray-900">{po?.poNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supplier:</span>
                  <span className="font-medium text-gray-900">{po?.supplier?.name || '-'}</span>
                </div>
              </div>
            </div>

            {/* Return Status Info */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Return Status</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  {getStatusBadge(returnItem.returnStatus)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Type:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    returnItem.returnType === 'REFUND'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {returnItem.returnType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Return Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(returnItem.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Item Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    {returnItem.returnType === 'REFUND' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Refund Amount
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{itemName}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {itemCode}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {returnItem.returnQty} units
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(Number(poItem?.unitPrice || 0))}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {getReturnReasonLabel(returnItem.returnReason)}
                      </span>
                    </td>
                    {returnItem.returnType === 'REFUND' && (
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <DollarSign className="h-4 w-4" />
                          {formatCurrency(Number(returnItem.refundAmount))}
                        </div>
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Replacement PO Info (if applicable) */}
          {returnItem.returnType === 'REPLACEMENT' && returnItem.replacementPO && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Replacement Order</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Replacement PO:</span>
                  <span className="font-medium text-gray-900">{returnItem.replacementPO.poNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">PO Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    returnItem.replacementPO.status === 'RECEIVED'
                      ? 'bg-green-100 text-green-800'
                      : returnItem.replacementPO.status === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {returnItem.replacementPO.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Refund Transaction Details (if processed) */}
          {returnItem.returnType === 'REFUND' && returnItem.refundTransactions && returnItem.refundTransactions.length > 0 && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Refund Transaction</h3>
              </div>
              {returnItem.refundTransactions.map((transaction) => (
                <div key={transaction.id} className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Amount:</span>
                    <span className="font-semibold text-green-700">
                      {formatCurrency(Number(transaction.refundAmount))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refund Date:</span>
                    <span className="font-medium text-gray-900">{formatDateTime(transaction.refundDate)}</span>
                  </div>
                  {transaction.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium text-gray-900">{transaction.paymentMethod.name}</span>
                    </div>
                  )}
                  {transaction.referenceNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reference Number:</span>
                      <span className="font-mono text-xs font-medium text-gray-900">{transaction.referenceNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processed By:</span>
                    <span className="font-medium text-gray-900">
                      {transaction.processedByUser?.name || 'Unknown'}
                    </span>
                  </div>
                  {transaction.notes && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-gray-600 italic">{transaction.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          {returnItem.notes && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Notes</h3>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{returnItem.notes}</p>
            </div>
          )}

          {/* Created By Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Created By:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {returnItem.createdByUser?.name || 'Unknown'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-gray-600">Created At:</span>
                  <span className="ml-2 font-medium text-gray-900">
                    {formatDateTime(returnItem.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
