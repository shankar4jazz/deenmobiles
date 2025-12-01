import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/serviceApi';
import { technicianApi, TechnicianForAssignment } from '@/services/technicianApi';
import { UserCheck, AlertCircle, Search, ChevronDown, ChevronUp, Filter, Eye } from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';
import TechnicianCard from './TechnicianCard';
import TechnicianProfileModal from './TechnicianProfileModal';

interface TechnicianAssignmentProps {
  serviceId: string;
  branchId?: string;
  serviceCategoryId?: string;
  currentAssignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  canAssign: boolean;
}

type SortOption = 'workload' | 'rating' | 'points';

export default function TechnicianAssignment({
  serviceId,
  branchId,
  serviceCategoryId,
  currentAssignee,
  canAssign,
}: TechnicianAssignmentProps) {
  const queryClient = useQueryClient();
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('workload');
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch technicians for assignment
  const { data: techniciansData, isLoading } = useQuery({
    queryKey: ['technicians-for-assignment', branchId, serviceCategoryId, showAvailableOnly, sortBy],
    queryFn: () =>
      technicianApi.getTechniciansForAssignment({
        branchId: branchId!,
        categoryId: serviceCategoryId,
        available: showAvailableOnly || undefined,
        sortBy,
      }),
    enabled: canAssign && !!branchId,
  });

  // Assign technician mutation
  const assignMutation = useMutation({
    mutationFn: (data: { technicianId: string; notes?: string }) =>
      serviceApi.assignTechnician(serviceId, data.technicianId, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['technicians-for-assignment'] });
      setShowList(false);
      setSearchQuery('');
      setNotes('');
    },
  });

  const technicians = techniciansData?.technicians || [];
  const filteredTechnicians = technicians.filter(
    (tech: TechnicianForAssignment) =>
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tech.email && tech.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssign = (technicianId: string) => {
    assignMutation.mutate({ technicianId, notes });
  };

  // Get current assignee's profile info if available
  const currentAssigneeProfile = currentAssignee
    ? technicians.find((t) => t.id === currentAssignee.id)
    : null;

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

      {/* Current Assignment Display - Enhanced */}
      {currentAssignee && !showList && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {currentAssignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{currentAssignee.name}</div>
              {currentAssigneeProfile?.profile?.currentLevel && (
                <LevelBadge
                  name={currentAssigneeProfile.profile.currentLevel.name}
                  badgeColor={currentAssigneeProfile.profile.currentLevel.badgeColor}
                  size="sm"
                  showIcon={false}
                />
              )}
            </div>
            {currentAssigneeProfile && (
              <div className="flex items-center gap-2">
                <div className="text-right text-xs text-gray-500">
                  <div>
                    {currentAssigneeProfile.totalWorkload}/{currentAssigneeProfile.profile.maxConcurrentJobs} jobs
                  </div>
                  {currentAssigneeProfile.profile.averageRating && (
                    <div className="flex items-center gap-1 justify-end">
                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {currentAssigneeProfile.profile.averageRating.toFixed(1)}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProfileModal(true);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Technician Profile Modal */}
      {currentAssigneeProfile && (
        <TechnicianProfileModal
          technician={currentAssigneeProfile}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {!currentAssignee && !showList && (
        <div className="mt-2 text-sm text-gray-400 italic">
          {canAssign ? 'Click to assign technician' : 'Not assigned'}
        </div>
      )}

      {/* Technician List - Enhanced */}
      {showList && canAssign && (
        <div className="mt-3 space-y-3">
          {/* Search & Filters */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter & Sort Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-600">Available only</span>
              </label>

              <div className="flex items-center gap-1 ml-auto">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="workload">Lowest Workload</option>
                  <option value="rating">Highest Rating</option>
                  <option value="points">Most Points</option>
                </select>
              </div>

              <div className="flex items-center gap-1 border border-gray-300 rounded">
                <button
                  onClick={() => setViewMode('compact')}
                  className={`px-2 py-1 text-xs ${viewMode === 'compact' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
                >
                  Compact
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-2 py-1 text-xs ${viewMode === 'detailed' ? 'bg-gray-100 text-gray-700' : 'text-gray-400'}`}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>

          {/* Notes (Optional) */}
          <textarea
            placeholder="Assignment notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          {/* Technicians List */}
          <div className="max-h-80 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                Loading technicians...
              </div>
            ) : filteredTechnicians.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {technicians.length === 0
                  ? 'No technicians available in this branch'
                  : 'No technicians match your search'}
              </div>
            ) : (
              filteredTechnicians.map((tech: TechnicianForAssignment) => (
                <TechnicianCard
                  key={tech.id}
                  technician={tech}
                  isSelected={currentAssignee?.id === tech.id}
                  onSelect={handleAssign}
                  compact={viewMode === 'compact'}
                />
              ))
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-400" />
              <span>Busy</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded" />
              <span>&lt;50% load</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded" />
              <span>50-80% load</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded" />
              <span>&gt;80% load</span>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowList(false);
              setSearchQuery('');
              setNotes('');
            }}
            className="w-full px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          {assignMutation.isError && (
            <div className="p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {(assignMutation.error as any)?.response?.data?.message || 'Failed to assign technician'}
              </span>
            </div>
          )}

          {assignMutation.isPending && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
