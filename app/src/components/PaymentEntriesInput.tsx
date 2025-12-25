import React from 'react';
import { Control, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { PaymentMethod } from '../types';

export interface PaymentEntry {
  amount: number;
  paymentMethodId: string;
  notes?: string;
  transactionId?: string;
}

interface PaymentEntriesInputProps {
  control: Control<any>;
  paymentMethods: PaymentMethod[];
  fieldName?: string;
  totalAmount?: number;
  showTotal?: boolean;
  minEntries?: number;
}

export const PaymentEntriesInput: React.FC<PaymentEntriesInputProps> = ({
  control,
  paymentMethods,
  fieldName = 'paymentEntries',
  totalAmount,
  showTotal = true,
  minEntries = 0,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldName,
  });

  const handleAddPayment = () => {
    append({
      amount: 0,
      paymentMethodId: '',
      notes: '',
      transactionId: '',
    });
  };

  // Watch the payment entries for real-time updates
  const watchedPaymentEntries = useWatch({
    control,
    name: fieldName,
    defaultValue: [],
  });

  // Calculate total from watched values
  const calculateTotal = () => {
    if (!watchedPaymentEntries || !Array.isArray(watchedPaymentEntries)) {
      return 0;
    }
    return watchedPaymentEntries.reduce((sum: number, entry: any) => {
      return sum + Number(entry?.amount || 0);
    }, 0);
  };

  const currentTotal = calculateTotal();
  const remainingAmount = totalAmount ? totalAmount - currentTotal : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Payment Details
        </label>
        <button
          type="button"
          onClick={handleAddPayment}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Payment
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">No payment entries added</p>
          <button
            type="button"
            onClick={handleAddPayment}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Add first payment entry
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="flex gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                {/* Amount */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name={`${fieldName}.${index}.amount`}
                    rules={{ required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } }}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={value || ''}
                          onChange={(e) => onChange(Number(e.target.value))}
                          className={`w-full px-2 py-1.5 border rounded-md text-sm ${
                            error ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="0.00"
                        />
                        {error && (
                          <p className="text-xs text-red-500 mt-0.5">{error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    control={control}
                    name={`${fieldName}.${index}.paymentMethodId`}
                    rules={{ required: 'Payment method is required' }}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                      <div>
                        <select
                          value={value || ''}
                          onChange={onChange}
                          className={`w-full px-2 py-1.5 border rounded-md text-sm ${
                            error ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Method</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name}
                            </option>
                          ))}
                        </select>
                        {error && (
                          <p className="text-xs text-red-500 mt-0.5">{error.message}</p>
                        )}
                      </div>
                    )}
                  />
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Transaction ID
                  </label>
                  <Controller
                    control={control}
                    name={`${fieldName}.${index}.transactionId`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        value={field.value || ''}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        placeholder="Optional"
                      />
                    )}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Notes
                  </label>
                  <Controller
                    control={control}
                    name={`${fieldName}.${index}.notes`}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        value={field.value || ''}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                        placeholder="Optional"
                      />
                    )}
                  />
                </div>
              </div>

              {/* Remove Button */}
              {fields.length > minEntries && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="self-start p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove payment entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Total Summary */}
      {showTotal && fields.length > 0 && (
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <div className="text-sm">
            <span className="text-gray-600">Total Payments:</span>
            <span className="ml-2 font-semibold text-gray-900">
              ₹{currentTotal.toFixed(2)}
            </span>
          </div>
          {totalAmount !== undefined && (
            <div className="text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span
                className={`ml-2 font-semibold ${
                  remainingAmount === 0
                    ? 'text-green-600'
                    : remainingAmount < 0
                    ? 'text-red-600'
                    : 'text-amber-600'
                }`}
              >
                ₹{Math.abs(remainingAmount).toFixed(2)}
                {remainingAmount > 0 && ' (pending)'}
                {remainingAmount < 0 && ' (excess)'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
