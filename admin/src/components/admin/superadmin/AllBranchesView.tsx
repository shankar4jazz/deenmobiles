import { ChevronRight, TrendingUp, TrendingDown, Users, Wrench, Package, AlertTriangle } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  manager: {
    name: string;
    email: string;
  } | null;
  totalCustomers: number;
  totalServices: number;
  pendingServices: number;
  completedServices: number;
  revenue: number;
  expenses: number;
  profit: number;
  totalEmployees: number;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

interface AllBranchesViewProps {
  branches: Branch[];
  onBranchSelect: (branchId: string) => void;
}

export default function AllBranchesView({ branches, onBranchSelect }: AllBranchesViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">All Branches Performance</h2>
        <p className="text-sm text-gray-600 mt-1">
          Click on any branch to view detailed analytics
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customers
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Services
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Inventory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {branches.map((branch) => (
              <tr
                key={branch.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onBranchSelect(branch.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">
                        {branch.code}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                      <div className="text-sm text-gray-500">{branch.code}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {branch.manager?.name || 'No Manager'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {branch.manager?.email || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">
                      {branch.totalCustomers.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {branch.totalServices}
                      </div>
                      <div className="text-xs text-gray-500">
                        {branch.pendingServices} pending
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{branch.revenue.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    {branch.profit >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        branch.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      ₹{Math.abs(branch.profit).toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {branch.totalItems}
                      </div>
                      {(branch.lowStockItems > 0 || branch.outOfStockItems > 0) && (
                        <div className="flex items-center gap-1 text-xs text-red-600">
                          <AlertTriangle className="w-3 h-3" />
                          {branch.lowStockItems} low
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      branch.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => onBranchSelect(branch.id)}
                    className="text-purple-600 hover:text-purple-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {branches.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No branches found</p>
        </div>
      )}
    </div>
  );
}
