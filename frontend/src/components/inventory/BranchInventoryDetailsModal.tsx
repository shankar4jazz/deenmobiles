import { X, Package, TrendingUp, DollarSign, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { BranchInventory } from '@/types';
import { getStockStatusColor, getStockStatusText } from '@/constants/inventory';

interface BranchInventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: BranchInventory;
}

export default function BranchInventoryDetailsModal({
  isOpen,
  onClose,
  inventory,
}: BranchInventoryDetailsModalProps) {
  if (!isOpen || !inventory) return null;

  const stockStatusColor = getStockStatusColor(
    inventory.stockQuantity,
    inventory.minStockLevel,
    inventory.reorderLevel
  );

  const stockStatusText = getStockStatusText(
    inventory.stockQuantity,
    inventory.minStockLevel,
    inventory.reorderLevel
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Item Details</h2>
              <p className="text-sm text-gray-600">
                {inventory.item?.itemName || 'N/A'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Status Alert */}
          {stockStatusColor !== 'green' && (
            <div
              className={`p-4 rounded-lg border ${
                stockStatusColor === 'red'
                  ? 'bg-red-50 border-red-200'
                  : stockStatusColor === 'orange'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start">
                <AlertTriangle
                  className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                    stockStatusColor === 'red'
                      ? 'text-red-600'
                      : stockStatusColor === 'orange'
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                  }`}
                />
                <div>
                  <h4 className="font-semibold text-gray-800">{stockStatusText}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Current stock: {inventory.stockQuantity}{' '}
                    {inventory.item?.itemUnit?.name || 'units'}
                    {inventory.minStockLevel &&
                      ` | Min level: ${inventory.minStockLevel}`}
                    {inventory.reorderLevel &&
                      ` | Reorder level: ${inventory.reorderLevel}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Basic Information */}
          <div className="bg-gray-50 p-5 rounded-lg">
            <div className="flex items-center mb-4">
              <Package className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Basic Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label="Item Code" value={inventory.item?.itemCode || 'N/A'} />
              <DetailItem
                label="Item Name"
                value={inventory.item?.itemName || 'N/A'}
              />
              <DetailItem
                label="Category"
                value={inventory.item?.itemCategory?.name || 'N/A'}
              />
              <DetailItem
                label="Brand"
                value={inventory.item?.itemBrand?.name || 'N/A'}
              />
              <DetailItem
                label="Model"
                value={inventory.item?.itemModel?.name || 'N/A'}
              />
              <DetailItem
                label="Unit"
                value={inventory.item?.itemUnit?.name || 'N/A'}
              />
              {inventory.item?.modelVariant && (
                <DetailItem
                  label="Model Variant"
                  value={inventory.item.modelVariant}
                />
              )}
              {inventory.item?.description && (
                <DetailItem
                  label="Description"
                  value={inventory.item.description}
                  className="md:col-span-2 lg:col-span-3"
                />
              )}
            </div>
          </div>

          {/* Pricing & GST Information */}
          <div className="bg-blue-50 p-5 rounded-lg">
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Pricing & GST Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <DetailItem
                  label="HSN Code"
                  value={inventory.item?.hsnCode || 'N/A'}
                />
                <DetailItem
                  label="GST Rate"
                  value={
                    inventory.item?.itemGSTRate
                      ? `${inventory.item.itemGSTRate.rate}%`
                      : 'N/A'
                  }
                />
                <DetailItem
                  label="Tax Type"
                  value={inventory.item?.taxType || 'N/A'}
                />
              </div>
              <div className="space-y-3">
                <DetailItem
                  label="Purchase Price"
                  value={
                    inventory.item?.purchasePrice
                      ? `₹${Number(inventory.item.purchasePrice).toFixed(2)}`
                      : 'N/A'
                  }
                />
                <DetailItem
                  label="Sales Price"
                  value={
                    inventory.item?.salesPrice
                      ? `₹${Number(inventory.item.salesPrice).toFixed(2)}`
                      : 'N/A'
                  }
                />
                {inventory.item?.purchasePrice && inventory.item?.salesPrice && (
                  <DetailItem
                    label="Profit Margin"
                    value={
                      <span className="text-green-600 font-semibold">
                        ₹
                        {(
                          Number(inventory.item.salesPrice) -
                          Number(inventory.item.purchasePrice)
                        ).toFixed(2)}
                      </span>
                    }
                  />
                )}
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-yellow-50 p-5 rounded-lg">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-yellow-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">
                Stock Information
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-600">Current Stock</span>
                <p className="text-2xl font-bold text-gray-800">
                  {inventory.stockQuantity}
                </p>
                <span className="text-xs text-gray-500">
                  {inventory.item?.itemUnit?.name || 'units'}
                </span>
              </div>
              <DetailItem
                label="Min Stock Level"
                value={inventory.minStockLevel || 'Not set'}
              />
              <DetailItem
                label="Max Stock Level"
                value={inventory.maxStockLevel || 'Not set'}
              />
              <DetailItem
                label="Reorder Level"
                value={inventory.reorderLevel || 'Not set'}
              />
            </div>
          </div>

          {/* Supplier Information */}
          {inventory.supplier && (
            <div className="bg-green-50 p-5 rounded-lg">
              <div className="flex items-center mb-4">
                <Package className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Supplier Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem label="Supplier Name" value={inventory.supplier.name} />
                <DetailItem
                  label="Supplier Code"
                  value={inventory.supplier.supplierCode}
                />
                <DetailItem label="Phone" value={inventory.supplier.phone || 'N/A'} />
              </div>
            </div>
          )}

          {/* Purchase Information */}
          {(inventory.lastPurchaseDate || inventory.lastPurchasePrice) && (
            <div className="bg-purple-50 p-5 rounded-lg">
              <div className="flex items-center mb-4">
                <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Last Purchase Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inventory.lastPurchaseDate && (
                  <DetailItem
                    label="Last Purchase Date"
                    value={format(new Date(inventory.lastPurchaseDate), 'dd MMM yyyy')}
                  />
                )}
                {inventory.lastPurchasePrice && (
                  <DetailItem
                    label="Last Purchase Price"
                    value={`₹${Number(inventory.lastPurchasePrice).toFixed(2)}`}
                  />
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-100 p-4 rounded-lg text-xs text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <span className="font-medium">Created:</span>{' '}
                {format(new Date(inventory.createdAt), 'dd MMM yyyy HH:mm')}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>{' '}
                {format(new Date(inventory.updatedAt), 'dd MMM yyyy HH:mm')}
              </div>
              <div>
                <span className="font-medium">Branch:</span>{' '}
                {inventory.branch?.name || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper component for displaying detail items
const DetailItem: React.FC<{
  label: string;
  value: React.ReactNode;
  className?: string;
}> = ({ label, value, className = '' }) => (
  <div className={className}>
    <span className="text-xs text-gray-600 block mb-1">{label}</span>
    <p className="text-sm text-gray-900 font-medium">{value}</p>
  </div>
);
