import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Loader2,
  Package,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { inventoryApi } from '../../services/inventoryApi';
import { format } from 'date-fns';
import {
  getCategoryLabel,
  getUnitLabel,
  formatCurrency,
  calculateGST,
  getStockStatusColor,
  getStockStatusText,
} from '../../constants/inventory';
import { GST_RATES, TAX_TYPES, STOCK_MOVEMENT_TYPES } from '../../constants/inventory';

interface InventoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
}

const InventoryDetailsModal: React.FC<InventoryDetailsModalProps> = ({
  isOpen,
  onClose,
  inventoryId,
}) => {
  const [movementsPage, setMovementsPage] = useState(1);

  // Fetch inventory data
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['inventory', inventoryId],
    queryFn: () => inventoryApi.getInventoryById(inventoryId),
    enabled: isOpen && !!inventoryId,
  });

  // Fetch stock movement history
  const { data: movementsData, isLoading: isLoadingMovements } = useQuery({
    queryKey: ['inventory-movements', inventoryId, movementsPage],
    queryFn: () =>
      inventoryApi.getStockMovementHistory(inventoryId, movementsPage, 10),
    enabled: isOpen && !!inventoryId,
  });

  if (!isOpen) return null;

  const gstCalculation = inventory
    ? calculateGST(inventory.purchasePrice, inventory.gstRate)
    : null;

  const stockStatusColor = inventory
    ? getStockStatusColor(
        inventory.stockQuantity,
        inventory.minStockLevel,
        inventory.reorderLevel
      )
    : 'gray';

  const stockStatusText = inventory
    ? getStockStatusText(
        inventory.stockQuantity,
        inventory.minStockLevel,
        inventory.reorderLevel
      )
    : '';

  const gstRateLabel = GST_RATES.find((r) => r.value === inventory?.gstRate)?.label;
  const taxTypeLabel = TAX_TYPES.find((t) => t.value === inventory?.taxType)?.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Inventory Details
            </h2>
            {inventory && (
              <p className="text-sm text-gray-600 mt-1">
                Part Number: {inventory.partNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Loading State */}
        {isLoadingInventory ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading details...</span>
          </div>
        ) : inventory ? (
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
                    <h4 className="font-semibold text-gray-800">
                      {stockStatusText}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Current stock: {inventory.stockQuantity} {getUnitLabel(inventory.unit)}
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
                <DetailItem label="Part Name" value={inventory.partName} />
                <DetailItem
                  label="Category"
                  value={getCategoryLabel(inventory.category)}
                />
                <DetailItem
                  label="Brand"
                  value={inventory.brandName || 'N/A'}
                />
                <DetailItem
                  label="Model Number"
                  value={inventory.modelNumber || 'N/A'}
                />
                <DetailItem
                  label="Unit"
                  value={getUnitLabel(inventory.unit)}
                />
                <DetailItem
                  label="Status"
                  value={
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inventory.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {inventory.active ? 'Active' : 'Inactive'}
                    </span>
                  }
                />
                {inventory.description && (
                  <DetailItem
                    label="Description"
                    value={inventory.description}
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
                  <DetailItem label="HSN Code" value={inventory.hsnCode} />
                  <DetailItem label="GST Rate" value={gstRateLabel || 'N/A'} />
                  <DetailItem label="Tax Type" value={taxTypeLabel || 'N/A'} />
                </div>
                <div className="space-y-3">
                  <DetailItem
                    label="Purchase Price"
                    value={formatCurrency(inventory.purchasePrice)}
                  />
                  <DetailItem
                    label="Sales Price"
                    value={formatCurrency(inventory.salesPrice)}
                  />
                  <DetailItem
                    label="Profit Margin"
                    value={
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(
                          inventory.salesPrice - inventory.purchasePrice
                        )}
                      </span>
                    }
                  />
                </div>
              </div>

              {/* GST Calculation */}
              {gstCalculation && (
                <div className="mt-4 bg-white p-4 rounded border border-blue-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    GST Calculation (on Purchase Price)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-xs text-gray-600">Base Price</span>
                      <p className="font-semibold text-sm">
                        {formatCurrency(inventory.purchasePrice)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">
                        GST ({gstCalculation.gstPercentage}%)
                      </span>
                      <p className="font-semibold text-sm">
                        {formatCurrency(gstCalculation.gstAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">
                        Total with GST
                      </span>
                      <p className="font-semibold text-sm text-blue-600">
                        {formatCurrency(gstCalculation.totalWithGST)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">
                        {inventory.taxType === 'CGST_SGST' ? 'CGST + SGST' : 'IGST'}
                      </span>
                      <p className="font-semibold text-sm">
                        {inventory.taxType === 'CGST_SGST'
                          ? `${formatCurrency(gstCalculation.cgst || 0)} + ${formatCurrency(gstCalculation.sgst || 0)}`
                          : formatCurrency(gstCalculation.igst || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    {getUnitLabel(inventory.unit)}
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
                  <User className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Supplier Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem
                    label="Supplier Name"
                    value={inventory.supplier.name}
                  />
                  <DetailItem
                    label="Supplier Code"
                    value={inventory.supplier.supplierCode}
                  />
                  <DetailItem
                    label="Phone"
                    value={inventory.supplier.phone || 'N/A'}
                  />
                  {inventory.supplier.email && (
                    <DetailItem label="Email" value={inventory.supplier.email} />
                  )}
                  {inventory.supplier.gstNumber && (
                    <DetailItem
                      label="GST Number"
                      value={inventory.supplier.gstNumber}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Purchase Information */}
            {(inventory.purchaseDate || inventory.billNumber) && (
              <div className="bg-purple-50 p-5 rounded-lg">
                <div className="flex items-center mb-4">
                  <FileText className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Purchase Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {inventory.purchaseDate && (
                    <DetailItem
                      label="Purchase Date"
                      value={format(new Date(inventory.purchaseDate), 'dd MMM yyyy')}
                    />
                  )}
                  {inventory.billNumber && (
                    <DetailItem
                      label="Bill/Invoice Number"
                      value={inventory.billNumber}
                    />
                  )}
                  {inventory.billAttachmentUrl && (
                    <DetailItem
                      label="Bill Attachment"
                      value={
                        <a
                          href={inventory.billAttachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Attachment
                        </a>
                      }
                    />
                  )}
                  {inventory.notes && (
                    <DetailItem
                      label="Notes"
                      value={inventory.notes}
                      className="md:col-span-2"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Stock Movement History */}
            <div className="bg-gray-50 p-5 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Stock Movement History
                  </h3>
                </div>
              </div>

              {isLoadingMovements ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                  <span className="ml-2 text-gray-600">Loading movements...</span>
                </div>
              ) : movementsData && movementsData.movements.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Type
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                            Before
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase">
                            After
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {movementsData.movements.map((movement) => {
                          const movementType = STOCK_MOVEMENT_TYPES.find(
                            (t) => t.value === movement.movementType
                          );
                          return (
                            <tr key={movement.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {format(
                                  new Date(movement.createdAt),
                                  'dd MMM yyyy HH:mm'
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium bg-${movementType?.color}-100 text-${movementType?.color}-700`}
                                >
                                  {movementType?.label || movement.movementType}
                                </span>
                              </td>
                              <td
                                className={`px-4 py-3 text-sm text-right font-semibold ${
                                  movement.quantity > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {movement.quantity > 0 ? '+' : ''}
                                {movement.quantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                {movement.previousQuantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 text-right font-semibold">
                                {movement.newQuantity}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {movement.notes || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {movementsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-gray-600">
                        Page {movementsData.pagination.page} of{' '}
                        {movementsData.pagination.totalPages} (
                        {movementsData.pagination.total} total movements)
                      </p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                          disabled={movementsData.pagination.page === 1}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Previous
                        </button>
                        <button
                          onClick={() => setMovementsPage((p) => p + 1)}
                          disabled={
                            movementsData.pagination.page ===
                            movementsData.pagination.totalPages
                          }
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Next
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stock movements recorded yet
                </div>
              )}
            </div>

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
                  {inventory.branch.name}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Inventory item not found
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

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

export default InventoryDetailsModal;
