import { X, Star, Zap, CheckCircle, Clock, Award, Briefcase } from 'lucide-react';
import { LevelBadge } from '../common/LevelBadge';
import { TechnicianForAssignment } from '@/services/technicianApi';

interface TechnicianProfileModalProps {
  technician: TechnicianForAssignment;
  isOpen: boolean;
  onClose: () => void;
}

export default function TechnicianProfileModal({
  technician,
  isOpen,
  onClose,
}: TechnicianProfileModalProps) {
  if (!isOpen) return null;

  const workloadPercent = technician.workloadPercent;
  const workloadColor =
    workloadPercent >= 80
      ? 'bg-red-500'
      : workloadPercent >= 50
      ? 'bg-yellow-500'
      : 'bg-green-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 pt-6 pb-16 px-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-white/80" />
            <h2 className="text-lg font-semibold text-white">Technician Profile</h2>
          </div>
        </div>

        {/* Profile Card - overlapping header */}
        <div className="relative px-6 -mt-12 mb-4">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {technician.profileImage ? (
                  <img
                    src={technician.profileImage}
                    alt={technician.name}
                    className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-white font-bold text-xl">
                      {technician.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${
                    technician.profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </div>

              {/* Name & Level */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">
                  {technician.name}
                </h3>
                {technician.email && (
                  <p className="text-sm text-gray-500 truncate">{technician.email}</p>
                )}
                {technician.profile.currentLevel && (
                  <div className="mt-2">
                    <LevelBadge
                      name={technician.profile.currentLevel.name}
                      badgeColor={technician.profile.currentLevel.badgeColor}
                      size="md"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Rating */}
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-yellow-600 mb-1">
                <Star className="w-4 h-4 fill-current" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {technician.profile.averageRating?.toFixed(1) || '-'}
              </p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>

            {/* Points */}
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {technician.profile.totalPoints.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Points</p>
            </div>

            {/* Completed */}
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {technician.profile.totalServicesCompleted}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        </div>

        {/* Workload */}
        <div className="px-6 pb-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Current Workload</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {technician.totalWorkload} / {technician.profile.maxConcurrentJobs} jobs
              </span>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 ${workloadColor} rounded-full transition-all`}
                style={{ width: `${Math.min(100, workloadPercent)}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  technician.canAcceptMore
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {technician.canAcceptMore ? 'Can accept more jobs' : 'At full capacity'}
              </span>
              <span className="text-gray-500">{workloadPercent}% utilized</span>
            </div>
          </div>
        </div>

        {/* Skills */}
        {technician.skills.length > 0 && (
          <div className="px-6 pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {technician.skills.map((skill) => (
                <div
                  key={skill.categoryId}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full"
                >
                  <span className="text-sm text-blue-800">{skill.categoryName}</span>
                  <div className="flex items-center gap-0.5 ml-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < skill.proficiencyLevel ? 'bg-blue-500' : 'bg-blue-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avg completion time */}
        {technician.profile.avgCompletionHours && (
          <div className="px-6 pb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>
                Average completion time:{' '}
                <span className="font-medium">
                  {technician.profile.avgCompletionHours.toFixed(1)} hours
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
