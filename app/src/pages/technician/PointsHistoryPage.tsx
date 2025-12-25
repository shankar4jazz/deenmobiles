import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { technicianApi, PointsHistoryEntry, PointsSummary } from '@/services/technicianApi';
import { useAuthStore } from '@/store/authStore';
import { LevelBadge } from '@/components/common/LevelBadge';
import {
  Star,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  Minus,
  Plus,
} from 'lucide-react';

const pointTypeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  SERVICE_COMPLETED: { label: 'Service Completed', color: 'bg-green-100 text-green-700', icon: <CheckCircle className="w-4 h-4" /> },
  SERVICE_DELIVERED: { label: 'Service Delivered', color: 'bg-blue-100 text-blue-700', icon: <Zap className="w-4 h-4" /> },
  RATING_BONUS: { label: 'Rating Bonus', color: 'bg-yellow-100 text-yellow-700', icon: <Star className="w-4 h-4" /> },
  SPEED_BONUS: { label: 'Speed Bonus', color: 'bg-purple-100 text-purple-700', icon: <Clock className="w-4 h-4" /> },
  MANUAL_ADJUSTMENT: { label: 'Manual Adjustment', color: 'bg-gray-100 text-gray-700', icon: <Award className="w-4 h-4" /> },
  PENALTY_LATE: { label: 'Late Penalty', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4" /> },
  PENALTY_REWORK: { label: 'Rework Penalty', color: 'bg-red-100 text-red-700', icon: <AlertCircle className="w-4 h-4" /> },
  PROMOTION_BONUS: { label: 'Promotion Bonus', color: 'bg-indigo-100 text-indigo-700', icon: <TrendingUp className="w-4 h-4" /> },
};

export default function PointsHistoryPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const limit = 15;

  // Fetch points summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['points-summary', user?.id],
    queryFn: () => technicianApi.getPointsSummary(user!.id),
    enabled: !!user?.id,
  });

  // Fetch points history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['points-history', user?.id, page],
    queryFn: () => technicianApi.getPointsHistory(user!.id, page, limit),
    enabled: !!user?.id,
  });

  // Fetch technician profile for level info
  const { data: profileData } = useQuery({
    queryKey: ['my-profile'],
    queryFn: technicianApi.getMyProfile,
    enabled: !!user?.id,
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPointTypeInfo = (type: string) => {
    return pointTypeConfig[type] || { label: type, color: 'bg-gray-100 text-gray-700', icon: <Zap className="w-4 h-4" /> };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Points History</h1>
        <p className="text-gray-600 mt-1">Track your earned points and rewards</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Points */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Zap className="w-8 h-8 text-purple-200" />
            {profileData?.profile?.currentLevel && (
              <LevelBadge
                name={profileData.profile.currentLevel.name}
                badgeColor={profileData.profile.currentLevel.badgeColor}
                size="sm"
              />
            )}
          </div>
          <div className="text-3xl font-bold">
            {summaryLoading ? '...' : summaryData?.totalPoints.toLocaleString() || 0}
          </div>
          <div className="text-purple-200 text-sm">Total Points</div>
        </div>

        {/* Monthly Points */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">This Month</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryLoading ? '...' : `+${summaryData?.monthlyPoints.toLocaleString() || 0}`}
          </div>
        </div>

        {/* Weekly Points */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">This Week</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {summaryLoading ? '...' : `+${summaryData?.weeklyPoints.toLocaleString() || 0}`}
          </div>
        </div>

        {/* Points Multiplier */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-500">Multiplier</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {profileData?.profile?.currentLevel?.pointsMultiplier || 1}x
          </div>
        </div>
      </div>

      {/* Points by Type */}
      {summaryData?.pointsByType && summaryData.pointsByType.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Points Breakdown (This Month)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryData.pointsByType.map((item) => {
              const typeInfo = getPointTypeInfo(item.type);
              return (
                <div key={item.type} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                    {typeInfo.icon}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{item.points}</div>
                    <div className="text-xs text-gray-500">{typeInfo.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : !historyData?.history || historyData.history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Zap className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No points history yet</p>
            <p className="text-sm">Complete services to start earning points!</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {historyData.history.map((entry: PointsHistoryEntry) => {
                const typeInfo = getPointTypeInfo(entry.type);
                const isPositive = entry.points >= 0;

                return (
                  <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                          {typeInfo.icon}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{entry.description}</div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                              {typeInfo.label}
                            </span>
                            {entry.service && (
                              <span className="text-gray-400">
                                #{entry.service.ticketNumber}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`flex items-center gap-1 text-lg font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? <Plus className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                          {Math.abs(entry.points)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(entry.createdAt)}
                        </div>
                        {entry.bonusMultiplier > 1 && (
                          <div className="text-xs text-purple-600 mt-0.5">
                            {entry.bonusMultiplier}x multiplier
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {historyData.pagination && historyData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Page {historyData.pagination.page} of {historyData.pagination.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= historyData.pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
