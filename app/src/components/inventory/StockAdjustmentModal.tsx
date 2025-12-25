import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X,
  AlertCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { branchInventoryApi } from '../../services/branchInventoryApi';
import { StockMovementType } from '../../types';
import { STOCK_MOVEMENT_TYPES } from '../../constants/inventory';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventoryId: string;
  onSuccess?: () => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  inventoryId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState<number>(0);
  const [movementType, setMovementType] = useState<StockMovementType>(
    StockMovementType.ADJUSTMENT
  );
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Fetch inventory data
  const { data: inventory, isLoading: isLoadingInventory } = useQuery({
    queryKey: ['branch-inventory', inventoryId],
    queryFn: () => branchInventoryApi.getBranchInventoryById(inventoryId),
    enabled: isOpen && !!inventoryId,
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(0);
      setMovementType(StockMovementType.ADJUSTMENT);
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  const adjustStockMutation = useMutation({
    mutationFn: (data: {
      quantity: number;
      movementType: StockMovementType;
      notes?: string;
    }) => branchInventoryApi.adjustStock(inventoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['branch-inventory'],
        exact: false,
        refetchType: 'all'
      });
      queryClient.invalidateQueries({ queryKey: ['branch-inventory', inventoryId] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to adjust stock');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (quantity === 0) {
      setError('Quantity must be different from 0');
      return;
    }

    if (!inventory) {
      setError('Inventory data not loaded');
      return;
    }

    const newQuantity = Number(inventory.stockQuantity) + quantity;

    if (newQuantity < 0) {
      setError(
        `Cannot adjust stock. Result would be negative (${newQuantity})`
      );
      return;
    }

    if (!notes.trim()) {
      setError('Please provide a reason for the adjustment');
      return;
    }

    adjustStockMutation.mutate({
      quantity,
      movementType,
      notes: notes.trim(),
    });
  };

  if (!isOpen) return null;

  const newQuantity = inventory ? Number(inventory.stockQuantity) + quantity : 0;
  const isIncrease = quantity > 0;
  const isDecrease = quantity < 0;

  // Filter movement types based on quantity change
  const availableMovementTypes = STOCK_MOVEMENT_TYPES.filter((type) => {
    // For increases
    if (isIncrease) {
      return [
        StockMovementType.PURCHASE,
        StockMovementType.RETURN,
        StockMovementType.ADJUSTMENT,
        StockMovementType.OPENING_STOCK,
      ].includes(type.value);
    }
    // For decreases
    if (isDecrease) {
      return [
        StockMovementType.SALE,
        StockMovementType.SERVICE_USE,
        StockMovementType.DAMAGE,
        StockMovementType.ADJUSTMENT,
        StockMovementType.TRANSFER,
      ].includes(type.value);
    }
    // For zero (show all)
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Adjust Stock Quantity
          </h2>
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
            <span className="ml-2 text-gray-600">Loading inventory data...</span>
          </div>
        ) : inventory ? (
          <>
            {/* Error Message */}
            {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Current Stock Display */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">
                      Current Stock
                    </h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {inventory.stockQuantity}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {inventory.item?.itemUnit?.name || 'units'} of {inventory.item?.itemName || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">Item Code</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {inventory.item?.itemCode || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustment Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Quantity <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    step="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                    placeholder="Enter positive or negative whole number"
                    required
                  />
                  {isIncrease && (
                    <TrendingUp className="absolute right-3 top-3.5 w-6 h-6 text-green-600" />
                  )}
                  {isDecrease && (
                    <TrendingDown className="absolute right-3 top-3.5 w-6 h-6 text-red-600" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use positive numbers to increase stock, negative to decrease
                </p>
              </div>

              {/* Movement Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movement Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as StockMovementType)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {availableMovementTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select the reason for this stock adjustment
                </p>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Explain why you are adjusting the stock..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be recorded in the audit trail
                </p>
              </div>

              {/* Preview */}
              {quantity !== 0 && (
                <div
                  className={`p-4 rounded-lg border ${
                    isIncrease
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start">
                    <Info
                      className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
                        isIncrease ? 'text-green-600' : 'text-red-600'
                      }`}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 mb-2">
                        Preview: Stock Change
                      </h4>
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-xs text-gray-600">Current</p>
                          <p className="text-2xl font-bold text-gray-800">
                            {inventory.stockQuantity}
                          </p>
                        </div>
                        <div>
                          <p
                            className={`text-lg font-semibold ${
                              isIncrease ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isIncrease ? '+' : ''}
                            {quantity}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">New</p>
                          <p
                            className={`text-2xl font-bold ${
                              newQuantity < 0
                                ? 'text-red-600'
                                : isIncrease
                                ? 'text-green-600'
                                : 'text-orange-600'
                            }`}
                          >
                            {newQuantity}
                          </p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600">Units</p>
                          <p className="text-sm font-medium text-gray-700">
                            {inventory.item?.itemUnit?.name || 'units'}
                          </p>
                        </div>
                      </div>

                      {newQuantity < 0 && (
                        <div className="mt-3 flex items-start">
                          <AlertTriangle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">
                            Warning: This will result in negative stock!
                          </p>
                        </div>
                      )}

                      {newQuantity <= (inventory.minStockLevel || 0) &&
                        newQuantity >= 0 && (
                          <div className="mt-3 flex items-start">
                            <AlertTriangle className="w-4 h-4 text-orange-600 mr-2 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-orange-700">
                              Note: New quantity is below minimum stock level (
                              {inventory.minStockLevel})
                            </p>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              )}

              {/* Audit Trail Notice */}
              <div className="bg-gray-50 p-3 rounded-lg flex items-start">
                <Info className="w-5 h-5 text-gray-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  This adjustment will be recorded in the stock movement history
                  with your user ID, timestamp, and the notes provided. This
                  creates a complete audit trail for compliance.
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={adjustStockMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustStockMutation.isPending || quantity === 0}
                  className={`px-4 py-2 rounded-md text-white disabled:cursor-not-allowed flex items-center ${
                    isIncrease
                      ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                      : isDecrease
                      ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {adjustStockMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adjusting...
                    </>
                  ) : (
                    <>
                      {isIncrease && <TrendingUp className="w-4 h-4 mr-2" />}
                      {isDecrease && <TrendingDown className="w-4 h-4 mr-2" />}
                      {quantity === 0
                        ? 'Enter Quantity'
                        : `Adjust Stock ${isIncrease ? '+' : ''}${quantity}`}
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            Inventory item not found
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAdjustmentModal;
