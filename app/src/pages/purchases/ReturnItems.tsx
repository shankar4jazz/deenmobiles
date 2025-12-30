import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/services/purchaseOrderApi';
import { purchaseReturnApi } from '@/services/purchaseReturnApi';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, PackageX, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { PurchaseReturnReason, PurchaseReturnType } from '@/types';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

interface ReturnItem {
  purchaseOrderItemId: string;
  itemName: string;
  itemCode: string;
  unitPrice: number;
  receivedQty: number;
  alreadyReturned: number;
  availableToReturn: number;
  returnQty: number;
  selected: boolean;
}

const RETURN_REASONS: { value: PurchaseReturnReason; label: string }[] = [
  { value: 'DAMAGED', label: 'Damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'QUALITY_ISSUE', label: 'Quality Issue' },
  { value: 'EXCESS_STOCK', label: 'Excess Stock' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'OTHER', label: 'Other' },
];

export default function ReturnItems() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState(1);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnType, setReturnType] = useState<PurchaseReturnType>('REFUND');
  const [returnReason, setReturnReason] = useState<PurchaseReturnReason>('DAMAGED');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Fetch purchase order data
  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  // Initialize return items when PO data is loaded
  useEffect(() => {
    if (po?.items) {
      // Initialize return items from PO items
      const items: ReturnItem[] = po.items.map((item: any) => {
        const alreadyReturned = parseFloat(item.returnedQty || 0);
        const receivedQty = parseFloat(item.receivedQty || 0);
        const availableToReturn = receivedQty - alreadyReturned;

        return {
          purchaseOrderItemId: item.id,
          itemName: item.item?.itemName || item.inventory?.partName || 'Unknown',
          itemCode: item.item?.itemCode || item.inventory?.partNumber || 'N/A',
          unitPrice: parseFloat(item.unitPrice),
          receivedQty,
          alreadyReturned,
          availableToReturn,
          returnQty: 0,
          selected: false,
        };
      });

      setReturnItems(items.filter(i => i.availableToReturn > 0));
    }
  }, [po]);

  // Create return mutation
  const createReturnMutation = useMutation({
    mutationFn: purchaseReturnApi.createReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      alert('Purchase return created successfully! Waiting for confirmation.');
      navigate(`/purchases/${id}`);
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create return');
    },
  });

  const handleItemSelect = (index: number) => {
    const updated = [...returnItems];
    updated[index].selected = !updated[index].selected;
    if (!updated[index].selected) {
      updated[index].returnQty = 0;
    }
    setReturnItems(updated);
  };

  const handleQtyChange = (index: number, qty: number) => {
    const updated = [...returnItems];
    const maxQty = updated[index].availableToReturn;
    updated[index].returnQty = Math.min(Math.max(0, qty), maxQty);
    setReturnItems(updated);
  };

  const handleNextStep = () => {
    setError('');

    if (step === 1) {
      const selectedItems = returnItems.filter(i => i.selected && i.returnQty > 0);
      if (selectedItems.length === 0) {
        setError('Please select at least one item to return');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');

    if (!user?.activeBranch?.id) {
      setError('Please select a branch first');
      return;
    }

    const selectedItems = returnItems.filter(i => i.selected && i.returnQty > 0);

    if (selectedItems.length === 0) {
      setError('No items selected for return');
      return;
    }

    // Create returns for each selected item
    try {
      for (const item of selectedItems) {
        await createReturnMutation.mutateAsync({
          purchaseOrderItemId: item.purchaseOrderItemId,
          returnQty: item.returnQty,
          returnReason,
          returnType,
          branchId: user.activeBranch.id,
          notes,
        });
      }
    } catch (err) {
      // Error already handled in mutation
    }
  };

  const selectedItems = returnItems.filter(i => i.selected && i.returnQty > 0);
  const totalRefundAmount = selectedItems.reduce((sum, item) => {
    return sum + (item.unitPrice * item.returnQty);
  }, 0);

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
            onClick={() => navigate('/purchases')}
            className="mt-4 text-indigo-600 hover:text-indigo-900"
          >
            Back to Purchase Orders
          </button>
        </div>
      </div>
    );
  }

  if (returnItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            No Items Available for Return
          </h2>
          <p className="mt-2 text-gray-600">
            All items from this purchase order have already been returned or not yet received.
          </p>
          <div className="mt-6">
            <button
              onClick={() => navigate(`/purchases/${id}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Back to Purchase Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/purchases/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Return Items</h1>
            <p className="mt-1 text-sm text-gray-500">
              Purchase Order: {po.poNumber}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Select Items</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Return Details</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
              3
            </div>
            <span className="ml-2 font-medium">Review & Confirm</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Step 1: Select Items */}
      {step === 1 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Select Items to Return
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Item
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Received
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Returned
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Available
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Return Qty
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {returnItems.map((item, index) => (
                  <tr key={index} className={item.selected ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleItemSelect(index)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.itemName}</div>
                      <div className="text-sm text-gray-500">{item.itemCode}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">
                      {item.receivedQty}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {item.alreadyReturned}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {item.availableToReturn}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <input
                        type="number"
                        min="0"
                        max={item.availableToReturn}
                        value={item.returnQty}
                        onChange={(e) => handleQtyChange(index, parseFloat(e.target.value) || 0)}
                        disabled={!item.selected}
                        className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedItems.length} item(s) selected
            </div>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Next: Return Details
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Return Details */}
      {step === 2 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Return Details
          </h2>

          <div className="space-y-6">
            {/* Return Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Return Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`relative flex cursor-pointer rounded-lg border p-4 ${returnType === 'REFUND' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    name="returnType"
                    value="REFUND"
                    checked={returnType === 'REFUND'}
                    onChange={(e) => setReturnType(e.target.value as PurchaseReturnType)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${returnType === 'REFUND' ? 'border-blue-600' : 'border-gray-300'}`}>
                        {returnType === 'REFUND' && (
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="ml-3 font-medium text-gray-900">Amount Received (Refund)</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Refund amount will be deducted from outstanding payment to supplier
                    </p>
                  </div>
                </label>

                <label className={`relative flex cursor-pointer rounded-lg border p-4 ${returnType === 'REPLACEMENT' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                  <input
                    type="radio"
                    name="returnType"
                    value="REPLACEMENT"
                    checked={returnType === 'REPLACEMENT'}
                    onChange={(e) => setReturnType(e.target.value as PurchaseReturnType)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${returnType === 'REPLACEMENT' ? 'border-blue-600' : 'border-gray-300'}`}>
                        {returnType === 'REPLACEMENT' && (
                          <div className="h-3 w-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="ml-3 font-medium text-gray-900">Replacement</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      New PO will be auto-created for replacement items
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Return Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Return Reason <span className="text-red-500">*</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as PurchaseReturnReason)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {RETURN_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Additional notes about this return..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Confirm */}
      {step === 3 && (
        <div className="space-y-6">
          {/* PO Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Purchase Order Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-500">PO Number</div>
                <div className="font-medium text-gray-900">{po.poNumber}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Supplier</div>
                <div className="font-medium text-gray-900">{po.supplier?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Order Date</div>
                <div className="font-medium text-gray-900">
                  {format(new Date(po.orderDate), 'dd MMM yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Return Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Return Summary
            </h2>

            <div className="space-y-4">
              {/* Return Type & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <div className="text-sm text-gray-500">Return Type</div>
                  <div className="font-medium text-gray-900">
                    {returnType === 'REFUND' ? 'Amount Received (Refund)' : 'Replacement'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Return Reason</div>
                  <div className="font-medium text-gray-900">
                    {RETURN_REASONS.find(r => r.value === returnReason)?.label}
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Items Being Returned</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Item
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Unit Price
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {item.itemName}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            {item.returnQty}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-900">
                            {formatCurrency(item.unitPrice)}
                          </td>
                          <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                            {formatCurrency(item.unitPrice * item.returnQty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                          {returnType === 'REFUND' ? 'Total Refund Amount:' : 'Total Replacement Value:'}
                        </td>
                        <td className="px-4 py-2 text-sm font-bold text-blue-600 text-right">
                          {formatCurrency(totalRefundAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-500 mb-1">Notes</div>
                  <div className="text-sm text-gray-900">{notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Return Confirmation Required
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  After submitting, this return will be in PENDING status. A manager must confirm it before:
                  {returnType === 'REFUND' ? (
                    <> stock is deducted and refund amount is applied to the purchase order.</>
                  ) : (
                    <> stock is deducted and the replacement purchase order is created.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={createReturnMutation.isPending}
              className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              <PackageX className="h-5 w-5 mr-2" />
              {createReturnMutation.isPending ? 'Submitting...' : 'Submit Return Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
