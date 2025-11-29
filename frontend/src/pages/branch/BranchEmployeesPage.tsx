import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { branchApi } from '@/services/branchApi';
import BranchEmployeesModal from '@/components/branches/BranchEmployeesModal';
import AddEmployeeModal from '@/components/branch/AddEmployeeModal';
import EditEmployeeModal from '@/components/branch/EditEmployeeModal';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  Shield,
  User,
  AlertCircle,
  Loader2,
  Grid,
  List,
  Building2,
  Edit,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

type ViewMode = 'card' | 'table';

export default function BranchEmployeesPage() {
  const user = useAuthStore((state) => state.user);
  const [showEmployeesModal, setShowEmployeesModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('card');

  // Use the active branch ID from global auth store
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Fetch branch employees
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['branchEmployees', branchId],
    queryFn: () => branchApi.getBranchEmployees(branchId!),
    enabled: !!branchId,
  });

  // Fetch branch details to get manager info
  const { data: branchDetails, isLoading: branchLoading } = useQuery({
    queryKey: ['branch', branchId],
    queryFn: () => branchApi.getBranchById(branchId!),
    enabled: !!branchId,
  });

  const isLoading = employeesLoading || branchLoading;

  // Combine manager and employees, with manager first (filter out manager from employees to avoid duplicates)
  const allStaff = branchDetails?.manager
    ? [
        { ...branchDetails.manager, isBranchAdmin: true },
        ...(employees || []).filter(emp => emp.id !== branchDetails.manager.id)
      ]
    : employees || [];

  // Handle edit employee
  const handleEdit = (employeeId: string) => {
    setEditEmployeeId(employeeId);
    setShowEditModal(true);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <p className="text-gray-600">Loading employees...</p>
          </div>
        </div>
      </>
    );
  }

  if (!branchId) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Branch Not Found</h2>
            <p className="text-gray-600 mt-2">You are not assigned to any branch.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Branch Employees
            </h1>
            <p className="text-gray-600 text-sm">
              Manage employees assigned to your branch
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'card'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Card View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-purple-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Add Employee Button */}
            <button
              onClick={() => setShowAddEmployeeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow text-xs font-medium"
            >
              <UserPlus className="h-4 w-4" />
              Add Employee
            </button>

            {/* Manage Employees Button (Secondary) */}
            <button
              onClick={() => setShowEmployeesModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all text-xs font-medium"
            >
              <Users className="h-4 w-4" />
              Manage
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs font-medium mb-0.5">Total Staff</p>
              <p className="text-2xl font-bold text-purple-600">{allStaff.length}</p>
              <p className="text-xs text-gray-500">
                {branchDetails?.manager
                  ? `1 Admin + ${allStaff.length - 1} Employees`
                  : `${allStaff.length} Employees`
                }
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Employee Cards or Table */}
        {allStaff && allStaff.length > 0 ? (
          viewMode === 'card' ? (
            /* Card View */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {allStaff.map((employee: any) => (
                <div
                  key={employee.id}
                  className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-all border border-gray-200"
                >
                  {/* Employee Header with Profile Image */}
                  <div className="flex items-start gap-2 mb-2">
                    <div className="h-10 w-10 flex-shrink-0">
                      {employee.profileImage ? (
                        <img
                          src={
                            employee.profileImage.startsWith('http')
                              ? employee.profileImage
                              : `${API_URL}${employee.profileImage}`
                          }
                          alt={employee.name}
                          className="h-10 w-10 rounded-full object-cover border border-purple-200"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {employee.name}
                      </h3>
                      {employee.username && (
                        <p className="text-xs text-gray-500">@{employee.username}</p>
                      )}
                    </div>
                  </div>

                  {/* Employee Details */}
                  <div className="space-y-1.5">
                    {/* Role */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {employee.isBranchAdmin && (
                        <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded text-xs font-bold">
                          ADMIN
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                        {employee.role.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Email */}
                    {employee.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{employee.email}</span>
                      </div>
                    )}

                    {/* Phone */}
                    {employee.phone && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Phone className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        <span>{employee.phone}</span>
                      </div>
                    )}

                    {/* Status and Actions */}
                    <div className="pt-1.5 border-t border-gray-200 flex items-center justify-between">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-xs font-medium ${
                          employee.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleEdit(employee.id)}
                        className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Edit Employee"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Employee
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Contact
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allStaff.map((employee: any) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              {employee.profileImage ? (
                                <img
                                  src={
                                    employee.profileImage.startsWith('http')
                                      ? employee.profileImage
                                      : `${API_URL}${employee.profileImage}`
                                  }
                                  alt={employee.name}
                                  className="h-8 w-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-purple-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-2">
                              <div className="text-xs font-medium text-gray-900">
                                {employee.name}
                              </div>
                              {employee.username && (
                                <div className="text-xs text-gray-500">
                                  @{employee.username}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {employee.email && (
                            <div className="text-xs text-gray-900 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {employee.email}
                            </div>
                          )}
                          {employee.phone && (
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {employee.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1 flex-wrap">
                            {employee.isBranchAdmin && (
                              <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded text-xs font-bold">
                                ADMIN
                              </span>
                            )}
                            <span className="text-xs font-medium text-gray-900">
                              {employee.role.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`px-1.5 py-0.5 inline-flex text-xs font-medium rounded ${
                            employee.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(employee.id)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="Edit Employee"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white rounded-xl p-12 shadow-sm">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Users className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No employees assigned</p>
              <p className="text-sm text-gray-400 mb-4">
                Add employees to your branch to get started
              </p>
              <button
                onClick={() => setShowAddEmployeeModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                Add Employees
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Employee Management Modal */}
      {branchId && (
        <BranchEmployeesModal
          branchId={branchId}
          isOpen={showEmployeesModal}
          onClose={() => setShowEmployeesModal(false)}
        />
      )}

      {/* Add Employee Modal */}
      {branchId && (
        <AddEmployeeModal
          branchId={branchId}
          branchName={branchName}
          isOpen={showAddEmployeeModal}
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

      {/* Edit Employee Modal */}
      {editEmployeeId && (
        <EditEmployeeModal
          employeeId={editEmployeeId}
          branchName={branchName}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditEmployeeId('');
          }}
        />
      )}
    </>
  );
}
