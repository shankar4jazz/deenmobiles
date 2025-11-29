import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { purchaseOrderApi } from '@/services/purchaseOrderApi';
import { ArrowLeft, PackageCheck, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ReceiveItemData {
  itemId: string; // This is the PurchaseOrderItem.id, not the Item.id
  receivedQty: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function ReceiveItems() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [receivedDate, setReceivedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Record<string, number>>({});

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(id!),
    enabled: !!id,
  });

  const receiveMutation = useMutation({
    mutationFn: (data: {
      items: ReceiveItemData[];
      receivedDate: string;
      notes?: string;
    }) => purchaseOrderApi.receiveItems(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      navigate(`/branch/purchases/${id}`);
    },
  });

  const handleQuantityChange = (purchaseOrderItemId: string, value: string) => {
    const qty = parseFloat(value) || 0;
    setItems((prev) => ({
      ...prev,
      [purchaseOrderItemId]: qty,
    }));
  };

  const handleReceiveAll = () => {
    const allItems: Record<string, number> = {};
    po?.items?.forEach((item: any) => {
      const remaining = item.quantity - item.receivedQty;
      if (remaining > 0) {
        allItems[item.id] = remaining; // Use PurchaseOrderItem.id
      }
    });
    setItems(allItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsToReceive: ReceiveItemData[] = Object.entries(items)
      .filter(([_, qty]) => qty > 0)
      .map(([purchaseOrderItemId, receivedQty]) => ({
        itemId: purchaseOrderItemId, // Backend expects this field to be named 'itemId' (it's actually PurchaseOrderItem.id)
        receivedQty,
      }));

    if (itemsToReceive.length === 0) {
      alert('Please enter quantity for at least one item');
      return;
    }

    // Validate quantities
    const invalidItems = itemsToReceive.filter((item) => {
      const poItem = po?.items?.find((i: any) => i.id === item.itemId);
      if (!poItem) return true;
      const remaining = poItem.quantity - poItem.receivedQty;
      return item.receivedQty > remaining;
    });

    if (invalidItems.length > 0) {
      alert('Some items have received quantity greater than remaining quantity');
      return;
    }

    receiveMutation.mutate({
      items: itemsToReceive,
      receivedDate,
      notes: notes || undefined,
    });
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading purchase order...</p>
          </div>
        </div>
      </>
    );
  }

  if (!po) {
    return (
      <>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Purchase Order Not Found
            </h2>
            <button
              onClick={() => navigate('/branch/purchases')}
              className="mt-4 text-indigo-600 hover:text-indigo-900"
            >
              Back to Purchase Orders
            </button>
          </div>
        </div>
      </>
    );
  }

  const pendingItems = po.items?.filter(
    (item: any) => item.receivedQty < item.quantity
  );

  if (!pendingItems || pendingItems.length === 0) {
    return (
      <>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <PackageCheck className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              All Items Received
            </h2>
            <p className="mt-2 text-gray-600">
              All items in this purchase order have been fully received.
            </p>
            <div className="mt-6 space-x-4">
              <button
                onClick={() => navigate(`/branch/purchases/${id}`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                View Details
              </button>
              <button
                onClick={() => navigate('/branch/purchases')}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to List
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/branch/purchases/${id}`)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Receive Items</h1>
              <p className="mt-1 text-sm text-gray-500">
                Purchase Order: {po.poNumber}
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Receiving Items
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Enter the quantity received for each item. You can receive partial
                quantities - remaining items can be received later.
              </p>
            </div>
          </div>
        </div>

        {/* PO Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">Supplier</div>
              <p className="mt-1 text-base font-medium text-gray-900">
                {po.supplier?.name}
              </p>
            </div>
            <div>
              <div className="text-sm text-gray-500">Order Date</div>
              <p className="mt-1 text-base font-medium text-gray-900">
                {format(new Date(po.orderDate), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Amount</div>
              <p className="mt-1 text-base font-medium text-gray-900">
                {formatCurrency(po.grandTotal)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receive Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Receive Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this delivery"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Items to Receive */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Items to Receive</h2>
              <button
                type="button"
                onClick={handleReceiveAll}
                className="text-sm text-indigo-600 hover:text-indigo-900 font-medium"
              >
                Receive All Pending
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ordered
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Already Received
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Receive Now
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingItems.map((item: any) => {
                    const remaining = item.quantity - item.receivedQty;
                    return (
                      <tr key={item.id}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {item.item?.itemName || 'Unknown Item'}
                          </div>
                          {item.item?.itemBrand?.name && (
                            <div className="text-sm text-gray-500">
                              {item.item.itemBrand.name}
                              {item.item.itemModel?.name && ` - ${item.item.itemModel.name}`}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          {item.receivedQty}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium text-blue-600">
                          {remaining}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <input
                            type="number"
                            value={items[item.id] || ''}
                            onChange={(e) =>
                              handleQuantityChange(item.id, e.target.value)
                            }
                            min="0"
                            max={remaining}
                            step="0.01"
                            placeholder="0"
                            className="w-24 text-right border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(`/branch/purchases/${id}`)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={receiveMutation.isPending}
              className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              <PackageCheck className="h-5 w-5 mr-2" />
              {receiveMutation.isPending ? 'Receiving...' : 'Receive Items'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
