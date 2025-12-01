import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { technicianApi, TechnicianForAssignment } from '@/services/technicianApi';
import { UserCheck, Eye, UserPlus } from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';
import TechnicianProfileModal from './TechnicianProfileModal';
import TechnicianAssignmentDrawer from './TechnicianAssignmentDrawer';

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

export default function TechnicianAssignment({
  serviceId,
  branchId,
  serviceCategoryId,
  currentAssignee,
  canAssign,
}: TechnicianAssignmentProps) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);

  // Fetch technicians to get current assignee's profile info
  const { data: techniciansData } = useQuery({
    queryKey: ['technicians-for-assignment', branchId, serviceCategoryId, false, 'workload'],
    queryFn: () =>
      technicianApi.getTechniciansForAssignment({
        branchId: branchId!,
        categoryId: serviceCategoryId,
        sortBy: 'workload',
      }),
    enabled: !!currentAssignee && !!branchId,
  });

  const technicians = techniciansData?.technicians || [];
  const currentAssigneeProfile = currentAssignee
    ? technicians.find((t: TechnicianForAssignment) => t.id === currentAssignee.id)
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Header */}
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-1 mb-3">
        <UserCheck className="w-3 h-3" />
        Technician
      </h3>

      {/* Current Assignment Display */}
      {currentAssignee ? (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
                  onClick={() => setShowProfileModal(true)}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                  title="View Profile"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-400 italic mb-3">
          No technician assigned
        </div>
      )}

      {/* Assign/Reassign Button */}
      {canAssign && (
        <button
          onClick={() => setShowAssignDrawer(true)}
          className={`mt-3 w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all ${
            currentAssignee
              ? 'bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          {currentAssignee ? 'Reassign Technician' : 'Assign Technician'}
        </button>
      )}

      {/* Technician Profile Modal */}
      {currentAssigneeProfile && (
        <TechnicianProfileModal
          technician={currentAssigneeProfile}
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Assignment Drawer */}
      <TechnicianAssignmentDrawer
        serviceId={serviceId}
        branchId={branchId}
        serviceCategoryId={serviceCategoryId}
        currentAssignee={currentAssignee}
        isOpen={showAssignDrawer}
        onClose={() => setShowAssignDrawer(false)}
      />
    </div>
  );
}
