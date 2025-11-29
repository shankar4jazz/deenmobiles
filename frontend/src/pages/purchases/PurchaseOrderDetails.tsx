import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/services/purchaseOrderApi';
import {
  ArrowLeft,
  Building2,
  Calendar,
  FileText,
  Package,
  DollarSign,
  PackageCheck,
  Truck,
  PackageX,
} from 'lucide-react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_RECEIVED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-green-100 text-green-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function PurchaseOrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading purchase order...</p>
        </div>
      </div>
    );
  }

  if (!po) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Order Not Found</h2>
          <button
            onClick={() => navigate('/branch/purchases')}
            className="mt-4 text-indigo-600 hover:text-indigo-900"
          >
            Back to Purchase Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/branch/purchases')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{po.poNumber}</h1>
              <p className="mt-1 text-sm text-gray-500">
                Created on {format(new Date(po.createdAt), 'dd MMM yyyy, hh:mm a')}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {po.status !== 'COMPLETED' && po.status !== 'CANCELLED' && (
              <button
                onClick={() => navigate(`/branch/purchases/${po.id}/receive`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <PackageCheck className="h-5 w-5 mr-2" />
                Receive Items
              </button>
            )}
            {po.grandTotal - po.paidAmount > 0 && (
              <button
                onClick={() => navigate(`/branch/purchases/${po.id}/payment`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <DollarSign className="h-5 w-5 mr-2" />
                Make Payment
              </button>
            )}
            {po.status !== 'DRAFT' && po.status !== 'CANCELLED' && (
              <button
                onClick={() => navigate(`/branch/purchases/${po.id}/return`)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                <PackageX className="h-5 w-5 mr-2" />
                Return Items
              </button>
            )}
          </div>
        </div>

        {/* Status and Basic Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <FileText className="h-4 w-4 mr-2" />
                Status
              </div>
              <span
                className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  STATUS_COLORS[po.status as keyof typeof STATUS_COLORS]
                }`}
              >
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Truck className="h-4 w-4 mr-2" />
                Supplier
              </div>
              <p className="text-base font-medium text-gray-900">
                {po.supplier?.name || 'N/A'}
              </p>
              {po.supplier?.phone && (
                <p className="text-sm text-gray-500">{po.supplier.phone}</p>
              )}
            </div>

            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Building2 className="h-4 w-4 mr-2" />
                Branch
              </div>
              <p className="text-base font-medium text-gray-900">
                {po.branch?.name || 'N/A'}
              </p>
            </div>

            <div>
              <div className="flex items-center text-sm text-gray-500 mb-1">
                <Calendar className="h-4 w-4 mr-2" />
                Order Date
              </div>
              <p className="text-base font-medium text-gray-900">
                {format(new Date(po.orderDate), 'dd MMM yyyy')}
              </p>
            </div>
          </div>

          {po.expectedDelivery && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">Expected Delivery</div>
              <p className="text-base font-medium text-gray-900">
                {format(new Date(po.expectedDelivery), 'dd MMM yyyy')}
              </p>
            </div>
          )}

          {po.invoiceNumber && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Invoice Number</div>
                  <p className="text-base font-medium text-gray-900">{po.invoiceNumber}</p>
                </div>
                {po.invoiceDate && (
                  <div>
                    <div className="text-sm text-gray-500">Invoice Date</div>
                    <p className="text-base font-medium text-gray-900">
                      {format(new Date(po.invoiceDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {po.notes && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500 mb-1">Notes</div>
              <p className="text-base text-gray-900">{po.notes}</p>
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Package className="h-5 w-5 mr-2" />
            Order Items
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ordered Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Received Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tax Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {po.items?.map((item: any) => {
                  const subtotal = item.quantity * item.unitPrice;
                  const taxAmount = (subtotal * item.taxRate) / 100;
                  const total = subtotal + taxAmount;

                  return (
                    <tr key={item.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {item.item?.itemName || item.inventory?.partName || 'Unknown Item'}
                        </div>
                        {item.item?.itemCode && (
                          <div className="text-sm text-gray-500">
                            Code: {item.item.itemCode}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <span
                          className={
                            item.receivedQty >= item.quantity
                              ? 'text-green-600 font-medium'
                              : 'text-gray-900'
                          }
                        >
                          {item.receivedQty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-900">
                        {item.taxRate}%
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Financial Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(po.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Amount:</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(po.taxAmount)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold border-t pt-3">
              <span>Grand Total:</span>
              <span className="text-indigo-600">
                {formatCurrency(po.grandTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm border-t pt-3">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-medium text-green-600">
                {formatCurrency(po.paidAmount)}
              </span>
            </div>
            {po.grandTotal - po.paidAmount > 0 && (
              <div className="flex justify-between text-base font-bold">
                <span className="text-red-600">Outstanding:</span>
                <span className="text-red-600">
                  {formatCurrency(po.grandTotal - po.paidAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        {po.payments && po.payments.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Payment History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {po.payments.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentMethod?.name || payment.paymentMethod || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.referenceNumber || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(payment.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}
