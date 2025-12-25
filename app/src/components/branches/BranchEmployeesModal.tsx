import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { branchApi } from '@/services/branchApi';
import { employeeApi } from '@/services/employeeApi';
import { X, Users, UserPlus, UserMinus, ArrowRightLeft, Loader2, User } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface BranchEmployeesModalProps {
  branchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BranchEmployeesModal({
  branchId,
  isOpen,
  onClose,
}: BranchEmployeesModalProps) {
  const queryClient = useQueryClient();
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Fetch branch employees
  const { data: employees, isLoading } = useQuery({
    queryKey: ['branchEmployees', branchId],
    queryFn: () => branchApi.getBranchEmployees(branchId),
    enabled: isOpen && !!branchId,
  });

  // Fetch all employees for adding
  const { data: allEmployeesData } = useQuery({
    queryKey: ['allEmployees'],
    queryFn: () => employeeApi.getAllEmployees({}, 1, 100),
    enabled: showAddEmployee,
  });

  // Add employee to branch mutation
  const addEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, branchId }: { employeeId: string; branchId: string }) =>
      employeeApi.addEmployeeToBranch(employeeId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchEmployees', branchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      setShowAddEmployee(false);
      setSelectedEmployeeId('');
      alert('Employee added to branch successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to add employee to branch');
    },
  });

  // Transfer employee mutation
  const transferEmployeeMutation = useMutation({
    mutationFn: ({ employeeId, branchId }: { employeeId: string; branchId: string }) =>
      employeeApi.transferEmployee(employeeId, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchEmployees'] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('Employee transferred successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to transfer employee');
    },
  });

  // Remove employee from branch mutation
  const removeEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) =>
      employeeApi.removeEmployeeFromBranch(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branchEmployees', branchId] });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      alert('Employee removed from branch successfully');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to remove employee from branch');
    },
  });

  const handleAddEmployee = () => {
    if (!selectedEmployeeId) {
      alert('Please select an employee');
      return;
    }
    addEmployeeMutation.mutate({ employeeId: selectedEmployeeId, branchId });
  };

  const handleRemoveEmployee = (employeeId: string, employeeName: string) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${employeeName} from this branch?`
      )
    ) {
      removeEmployeeMutation.mutate(employeeId);
    }
  };

  // Filter out employees who are already assigned to this branch
  const availableEmployees = allEmployeesData?.employees.filter(
    (emp) => !employees?.some((branchEmp) => branchEmp.id === emp.id) && !emp.branchId
  ) || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Branch Employees</h2>
              <p className="text-sm text-gray-600">
                {employees?.length || 0} employees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Add Employee Section */}
          {!showAddEmployee ? (
            <button
              onClick={() => setShowAddEmployee(true)}
              className="w-full mb-4 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-purple-600"
            >
              <UserPlus className="h-5 w-5" />
              <span className="font-medium">Add Employee to Branch</span>
            </button>
          ) : (
            <div className="mb-4 p-4 border border-purple-200 rounded-lg bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Add Existing Employee</h3>
                <button
                  onClick={() => {
                    setShowAddEmployee(false);
                    setSelectedEmployeeId('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select an employee</option>
                  {availableEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddEmployee}
                  disabled={addEmployeeMutation.isPending}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {addEmployeeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Add
                    </>
                  )}
                </button>
              </div>
              {availableEmployees.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  No available employees to add. All employees are already assigned to branches.
                </p>
              )}
            </div>
          )}

          {/* Employee List */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : employees && employees.length > 0 ? (
            <div className="space-y-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-10 w-10 flex-shrink-0">
                      {employee.profileImage ? (
                        <img
                          src={employee.profileImage.startsWith('http') ? employee.profileImage : `${API_URL}${employee.profileImage}`}
                          alt={employee.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-600">{employee.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                          {employee.role.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRemoveEmployee(employee.id, employee.name)}
                      disabled={removeEmployeeMutation.isPending}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from branch"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Users className="h-16 w-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No employees in this branch</p>
              <p className="text-sm">Add employees to get started</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
