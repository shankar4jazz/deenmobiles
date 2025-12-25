import { X, Package, User, FileText, Calendar, CreditCard, CheckCircle, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { SalesReturn, SalesReturnStatus } from '@/types';

interface SalesReturnDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesReturn: SalesReturn;
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

const getReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    DEFECTIVE: 'Defective Item',
    WRONG_ITEM: 'Wrong Item',
    CUSTOMER_CHANGED_MIND: 'Customer Changed Mind',
    DUPLICATE_BILLING: 'Duplicate Billing',
    PRICE_ADJUSTMENT: 'Price Adjustment',
    OTHER: 'Other',
  };
  return labels[reason] || reason;
};

const getStatusBadge = (status: SalesReturnStatus) => {
  const config: Record<SalesReturnStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      icon: <Clock className="h-4 w-4 mr-1" />,
    },
    CONFIRMED: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      icon: <CheckCircle className="h-4 w-4 mr-1" />,
    },
    REJECTED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      icon: <XCircle className="h-4 w-4 mr-1" />,
    },
  };
  return config[status];
};

export default function SalesReturnDetailModal({
  isOpen,
  onClose,
  salesReturn,
}: SalesReturnDetailModalProps) {
  if (!isOpen) return null;

  const statusConfig = getStatusBadge(salesReturn.returnStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{salesReturn.returnNumber}</h2>
              <p className="text-sm text-gray-500">Sales Return Details</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Banner */}
          <div className={`${statusConfig.bg} rounded-lg p-4 flex items-center justify-between`}>
            <div className="flex items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.icon}
                {salesReturn.returnStatus}
              </span>
              <span className="ml-4 text-sm text-gray-600">
                Created on {formatDateTime(salesReturn.createdAt)}
              </span>
            </div>
            {salesReturn.refundProcessed ? (
              <span className="inline-flex items-center text-green-600 text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-1" />
                Refund Processed
              </span>
            ) : salesReturn.returnStatus === 'CONFIRMED' ? (
              <span className="inline-flex items-center text-yellow-600 text-sm font-medium">
                <Clock className="h-4 w-4 mr-1" />
                Refund Pending
              </span>
            ) : null}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Invoice Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Invoice Information
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Invoice Number</dt>
                  <dd className="text-sm font-medium text-indigo-600">
                    {salesReturn.invoice?.invoiceNumber || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Invoice Amount</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {formatCurrency(salesReturn.invoice?.totalAmount || 0)}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Customer Information
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Name</dt>
                  <dd className="text-sm font-medium text-gray-900">
                    {salesReturn.customer?.name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Phone</dt>
                  <dd className="text-sm text-gray-900">{salesReturn.customer?.phone || 'N/A'}</dd>
                </div>
                {salesReturn.customer?.email && (
                  <div>
                    <dt className="text-xs text-gray-500">Email</dt>
                    <dd className="text-sm text-gray-900">{salesReturn.customer.email}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Return Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Return Details
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Return Date</dt>
                  <dd className="text-sm text-gray-900">{formatDate(salesReturn.returnDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Reason</dt>
                  <dd className="text-sm text-gray-900">{getReasonLabel(salesReturn.returnReason)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500">Created By</dt>
                  <dd className="text-sm text-gray-900">{salesReturn.createdBy?.name || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {/* Refund Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Refund Information
              </h3>
              <dl className="space-y-2">
                <div>
                  <dt className="text-xs text-gray-500">Total Return Amount</dt>
                  <dd className="text-lg font-bold text-orange-600">
                    {formatCurrency(Number(salesReturn.totalReturnAmount))}
                  </dd>
                </div>
                {salesReturn.refundProcessed && (
                  <>
                    <div>
                      <dt className="text-xs text-gray-500">Refunded Amount</dt>
                      <dd className="text-sm font-medium text-green-600">
                        {formatCurrency(Number(salesReturn.refundedAmount))}
                      </dd>
                    </div>
                    {salesReturn.paymentMethod && (
                      <div>
                        <dt className="text-xs text-gray-500">Payment Method</dt>
                        <dd className="text-sm text-gray-900">{salesReturn.paymentMethod.name}</dd>
                      </div>
                    )}
                    {salesReturn.referenceNumber && (
                      <div>
                        <dt className="text-xs text-gray-500">Reference Number</dt>
                        <dd className="text-sm text-gray-900">{salesReturn.referenceNumber}</dd>
                      </div>
                    )}
                    {salesReturn.processedBy && (
                      <div>
                        <dt className="text-xs text-gray-500">Processed By</dt>
                        <dd className="text-sm text-gray-900">
                          {salesReturn.processedBy.name} on{' '}
                          {salesReturn.processedAt && formatDateTime(salesReturn.processedAt)}
                        </dd>
                      </div>
                    )}
                  </>
                )}
              </dl>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Returned Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {salesReturn.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {item.invoiceItem?.description || 'N/A'}
                        {item.reason && (
                          <p className="text-xs text-gray-500 mt-1">Reason: {item.reason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        {item.returnQuantity}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(item.returnAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-orange-600">
                      {formatCurrency(Number(salesReturn.totalReturnAmount))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          {salesReturn.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{salesReturn.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
