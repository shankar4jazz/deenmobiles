import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/serviceApi';
import { api } from '@/services/api';
import { UserCheck, AlertCircle, Search, X, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface TechnicianAssignmentProps {
  serviceId: string;
  branchId?: string;
  currentAssignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  canAssign: boolean;
}

export default function TechnicianAssignment({
  serviceId,
  branchId,
  currentAssignee,
  canAssign,
}: TechnicianAssignmentProps) {
  const queryClient = useQueryClient();
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch technicians from the same branch
  const { data: techniciansData, isLoading } = useQuery({
    queryKey: ['technicians', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('role', 'TECHNICIAN');
      params.append('limit', '100');
      if (branchId) {
        params.append('branchId', branchId);
      }
      const response = await api.get(`/users?${params.toString()}`);
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
      setShowList(false);
      setSearchQuery('');
      setNotes('');
    },
  });

  const technicians = techniciansData?.users || [];
  const filteredTechnicians = technicians.filter((tech: any) =>
    tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = (technicianId: string) => {
    assignMutation.mutate({ technicianId, notes });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header - Clickable to show technician list */}
      <div
        className={`flex items-center justify-between ${canAssign ? 'cursor-pointer' : ''}`}
        onClick={() => canAssign && setShowList(!showList)}
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1">
          <UserCheck className="w-3 h-3" />
          Technician
        </h3>
        {canAssign && (
          <button className="text-gray-400 hover:text-gray-600">
            {showList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Current Assignment Display */}
      {currentAssignee && !showList && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="font-medium text-gray-900">{currentAssignee.name}</div>
          <div className="text-xs text-gray-500">{currentAssignee.email}</div>
        </div>
      )}

      {!currentAssignee && !showList && (
        <div className="mt-2 text-sm text-gray-400 italic">
          {canAssign ? 'Click to assign technician' : 'Not assigned'}
        </div>
      )}

      {/* Technician List */}
      {showList && canAssign && (
        <div className="mt-3 space-y-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search technician..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes (Optional) */}
          <textarea
            placeholder="Assignment notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Technicians List */}
          <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="p-3 text-center text-gray-500 text-sm">
                {technicians.length === 0 ? 'No technicians in this branch' : 'No technicians found'}
              </div>
            ) : (
              filteredTechnicians.map((tech: any) => (
                <button
                  key={tech.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAssign(tech.id);
                  }}
                  disabled={assignMutation.isPending}
                  className={`w-full p-2 hover:bg-gray-50 transition-colors text-left flex items-center justify-between disabled:opacity-50 ${
                    currentAssignee?.id === tech.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 flex items-center gap-1">
                      <span className="truncate">{tech.name}</span>
                      {currentAssignee?.id === tech.id && (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{tech.email}</div>
                  </div>
                  <Check className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Cancel Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowList(false);
              setSearchQuery('');
              setNotes('');
            }}
            className="w-full px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          {assignMutation.isError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded flex items-center gap-1 text-red-600 text-xs">
              <AlertCircle className="h-3 w-3" />
              <span>
                {(assignMutation.error as any)?.response?.data?.message || 'Failed to assign'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
