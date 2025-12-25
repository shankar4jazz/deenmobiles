import { formatCurrency } from "@/lib/utils";
import { IndianRupee, Wallet, Receipt } from "lucide-react";

interface PricingSummaryProps {
  estimatedCost: number;
  advancePayment: number;
  balanceAmount: number;
}

export default function PricingSummary({
  estimatedCost,
  advancePayment,
  balanceAmount,
}: PricingSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {/* Estimated Cost */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Estimated Cost</span>
          </div>
          <span className="font-semibold text-gray-900">
            {formatCurrency(estimatedCost)}
          </span>
        </div>

        {/* Advance Paid */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Advance Paid</span>
          </div>
          <span className="font-semibold text-green-600">
            - {formatCurrency(advancePayment)}
          </span>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between p-4 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-200 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-purple-700" />
            </div>
            <span className="text-sm font-medium text-purple-900">
              Balance Due
            </span>
          </div>
          <span className="font-bold text-lg text-purple-700">
            {formatCurrency(balanceAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
