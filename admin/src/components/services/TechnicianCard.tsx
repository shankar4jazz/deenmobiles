import React from 'react';
import { LevelBadge } from '../common/LevelBadge';
import { TechnicianForAssignment } from '../../services/technicianApi';

interface TechnicianCardProps {
  technician: TechnicianForAssignment;
  isSelected?: boolean;
  onSelect: (technicianId: string) => void;
  compact?: boolean;
}

export const TechnicianCard: React.FC<TechnicianCardProps> = ({
  technician,
  isSelected = false,
  onSelect,
  compact = false,
}) => {
  const workloadColor = technician.workloadPercent >= 80
    ? 'bg-red-500'
    : technician.workloadPercent >= 50
    ? 'bg-yellow-500'
    : 'bg-green-500';

  const availabilityBadge = technician.profile.isAvailable
    ? 'bg-green-100 text-green-800'
    : 'bg-gray-100 text-gray-600';

  if (compact) {
    return (
      <div
        onClick={() => onSelect(technician.id)}
        className={`p-3 rounded-lg border cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {technician.profileImage ? (
                <img
                  src={technician.profileImage}
                  alt={technician.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 font-medium text-sm">
                    {technician.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {technician.profile.isAvailable && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">{technician.name}</p>
              {technician.profile.currentLevel && (
                <LevelBadge
                  name={technician.profile.currentLevel.name}
                  badgeColor={technician.profile.currentLevel.badgeColor}
                  size="sm"
                  showIcon={false}
                />
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  technician.canAcceptMore
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {technician.totalWorkload}/{technician.profile.maxConcurrentJobs}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(technician.id)}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {technician.profileImage ? (
            <img
              src={technician.profileImage}
              alt={technician.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">
                {technician.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span
            className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
              technician.profile.isAvailable ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-gray-900 truncate">{technician.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded-full ${availabilityBadge}`}>
              {technician.profile.isAvailable ? 'Available' : 'Busy'}
            </span>
          </div>

          {technician.profile.currentLevel && (
            <div className="mt-1">
              <LevelBadge
                name={technician.profile.currentLevel.name}
                badgeColor={technician.profile.currentLevel.badgeColor}
                size="sm"
              />
            </div>
          )}

          {/* Skills */}
          {technician.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {technician.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill.categoryId}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {skill.categoryName}
                </span>
              ))}
              {technician.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{technician.skills.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            {technician.profile.averageRating && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>{technician.profile.averageRating.toFixed(1)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{technician.profile.totalServicesCompleted} completed</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>{technician.profile.totalPoints.toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        {/* Workload Indicator */}
        <div className="flex-shrink-0 w-20 text-center">
          <div className="text-xs text-gray-500 mb-1">Workload</div>
          <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 ${workloadColor} transition-all`}
              style={{ width: `${Math.min(100, technician.workloadPercent)}%` }}
            />
          </div>
          <div className="mt-1 text-sm font-medium text-gray-700">
            {technician.totalWorkload}/{technician.profile.maxConcurrentJobs}
          </div>
          {!technician.canAcceptMore && (
            <span className="text-xs text-red-600">Full</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechnicianCard;
