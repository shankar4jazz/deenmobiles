import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceApi } from '@/services/serviceApi';
import { technicianApi, TechnicianForAssignment } from '@/services/technicianApi';
import {
  X,
  Search,
  Filter,
  Star,
  Zap,
  CheckCircle,
  Briefcase,
  Award,
  Clock,
  UserPlus,
  AlertCircle,
} from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';

interface TechnicianAssignmentDrawerProps {
  serviceId: string;
  branchId?: string;
  serviceCategoryId?: string;
  currentAssignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

type SortOption = 'workload' | 'rating' | 'points';

export default function TechnicianAssignmentDrawer({
  serviceId,
  branchId,
  serviceCategoryId,
  currentAssignee,
  isOpen,
  onClose,
}: TechnicianAssignmentDrawerProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('workload');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string | null>(null);

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
    enabled: isOpen && !!branchId,
  });

  // Assign technician mutation
  const assignMutation = useMutation({
    mutationFn: (data: { technicianId: string; notes?: string }) =>
      serviceApi.assignTechnician(serviceId, data.technicianId, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['technicians-for-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      setSearchQuery('');
      setNotes('');
      setSelectedTechnicianId(null);
      onClose();
    },
  });

  const technicians = techniciansData?.technicians || [];
  const filteredTechnicians = technicians.filter(
    (tech: TechnicianForAssignment) =>
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tech.email && tech.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAssign = () => {
    if (selectedTechnicianId) {
      assignMutation.mutate({ technicianId: selectedTechnicianId, notes });
    }
  };

  const getWorkloadColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-white shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Assign Technician</h2>
                <p className="text-sm text-white/80">Select a technician for this service</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b bg-gray-50 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(e) => setShowAvailableOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Available only</span>
            </label>

            <div className="flex items-center gap-2 ml-auto">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="workload">Lowest Workload</option>
                <option value="rating">Highest Rating</option>
                <option value="points">Most Points</option>
              </select>
            </div>
          </div>
        </div>

        {/* Technicians List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mb-3" />
              <p className="text-gray-500">Loading technicians...</p>
            </div>
          ) : filteredTechnicians.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">
                {technicians.length === 0
                  ? 'No technicians available in this branch'
                  : 'No technicians match your search'}
              </p>
            </div>
          ) : (
            filteredTechnicians.map((tech: TechnicianForAssignment) => {
              const isSelected = selectedTechnicianId === tech.id;
              const isCurrent = currentAssignee?.id === tech.id;

              return (
                <div
                  key={tech.id}
                  onClick={() => !isCurrent && setSelectedTechnicianId(tech.id)}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : isCurrent
                      ? 'border-green-500 bg-green-50 cursor-default'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-medium rounded-full">
                      Current
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {tech.profileImage ? (
                        <img
                          src={tech.profileImage}
                          alt={tech.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-lg">
                            {tech.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          tech.profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                          {tech.profile.currentLevel && (
                            <LevelBadge
                              name={tech.profile.currentLevel.name}
                              badgeColor={tech.profile.currentLevel.badgeColor}
                              size="sm"
                              showIcon={false}
                            />
                          )}
                        </div>
                        {isSelected && (
                          <div className="p-1 bg-blue-500 rounded-full">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Stats Row */}
                      <div className="flex items-center gap-4 mt-2 text-xs">
                        {tech.profile.averageRating && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-medium">{tech.profile.averageRating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-purple-600">
                          <Zap className="w-3.5 h-3.5" />
                          <span className="font-medium">{tech.profile.totalPoints.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="font-medium">{tech.profile.totalServicesCompleted}</span>
                        </div>
                        {tech.profile.avgCompletionHours && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{tech.profile.avgCompletionHours.toFixed(1)}h</span>
                          </div>
                        )}
                      </div>

                      {/* Workload Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">
                            <Briefcase className="w-3 h-3 inline mr-1" />
                            Workload
                          </span>
                          <span className="font-medium">
                            {tech.totalWorkload}/{tech.profile.maxConcurrentJobs} jobs
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getWorkloadColor(tech.workloadPercent)} rounded-full transition-all`}
                            style={{ width: `${Math.min(100, tech.workloadPercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Skills */}
                      {tech.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {tech.skills.slice(0, 4).map((skill) => (
                            <span
                              key={skill.categoryId}
                              className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                            >
                              {skill.categoryName}
                            </span>
                          ))}
                          {tech.skills.length > 4 && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              +{tech.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-white p-4 space-y-3">
          {/* Notes */}
          <textarea
            placeholder="Assignment notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />

          {/* Error */}
          {assignMutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>
                {(assignMutation.error as any)?.response?.data?.message || 'Failed to assign technician'}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedTechnicianId || assignMutation.isPending}
              className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                selectedTechnicianId && !assignMutation.isPending
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {assignMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign Technician
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
