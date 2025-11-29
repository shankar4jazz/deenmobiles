import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/serviceApi';
import { api } from '@/services/api';
import { UserCheck, AlertCircle, Search, X, Check } from 'lucide-react';

interface TechnicianAssignmentProps {
  serviceId: string;
  currentAssignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  canAssign: boolean;
}

export default function TechnicianAssignment({
  serviceId,
  currentAssignee,
  canAssign,
}: TechnicianAssignmentProps) {
  const queryClient = useQueryClient();
  const [showAssignment, setShowAssignment] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch technicians
  const { data: techniciansData } = useQuery({
    queryKey: ['technicians'],
    queryFn: async () => {
      const response = await api.get('/users?role=TECHNICIAN&limit=100');
      return response.data.data;
    },
    enabled: canAssign,
  });

  // Assign technician mutation
  const assignMutation = useMutation({
    mutationFn: (data: { technicianId: string; notes?: string }) =>
      serviceApi.assignTechnician(serviceId, data.technicianId, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      setShowAssignment(false);
      setSearchQuery('');
      setNotes('');
    },
  });

  const filteredTechnicians = techniciansData?.users?.filter((tech: any) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAssign = (technicianId: string) => {
    assignMutation.mutate({ technicianId, notes });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <UserCheck className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Assignment</h3>
        </div>
        {canAssign && !showAssignment && (
          <button
            onClick={() => setShowAssignment(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {currentAssignee ? 'Reassign' : 'Assign Technician'}
          </button>
        )}
      </div>

      {/* Current Assignment */}
      {currentAssignee && !showAssignment && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">Assigned To</div>
              <div className="font-semibold text-gray-900">{currentAssignee.name}</div>
              <div className="text-sm text-gray-500 mt-1">{currentAssignee.email}</div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              ASSIGNED
            </span>
          </div>
        </div>
      )}

      {!currentAssignee && !showAssignment && (
        <div className="text-center py-6">
          <UserCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No technician assigned</p>
          {canAssign && (
            <p className="text-sm text-gray-400 mt-1">Click "Assign Technician" to assign this service</p>
          )}
        </div>
      )}

      {/* Assignment UI */}
      {showAssignment && canAssign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-medium text-gray-900">
              {currentAssignee ? 'Reassigning Service' : 'Assigning Service'}
            </span>
            <button
              onClick={() => {
                setShowAssignment(false);
                setSearchQuery('');
                setNotes('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Technicians */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Technician
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Notes (Optional)
            </label>
            <textarea
              placeholder="Add any notes for the technician..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Technicians List */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Technicians ({filteredTechnicians.length})
            </label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
              {filteredTechnicians.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No technicians found
                </div>
              ) : (
                filteredTechnicians.map((tech: any) => (
                  <button
                    key={tech.id}
                    onClick={() => handleAssign(tech.id)}
                    disabled={assignMutation.isPending}
                    className="w-full p-4 hover:bg-gray-50 transition-colors text-left flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {tech.name}
                        {currentAssignee?.id === tech.id && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">{tech.email}</div>
                      {tech.phone && (
                        <div className="text-xs text-gray-400 mt-0.5">{tech.phone}</div>
                      )}
                    </div>
                    <Check className="h-5 w-5 text-gray-400" />
                  </button>
                ))
              )}
            </div>
          </div>

          {assignMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>
                {(assignMutation.error as any)?.response?.data?.message || 'Failed to assign technician'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
