import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wrench, ClipboardCheck, Clock, Package, Star, Trophy, Zap, Bell, ChevronRight, TrendingUp } from 'lucide-react';
import { dashboardApi } from '@/services/dashboardApi';
import { technicianApi, TechnicianDashboardStats, TechnicianNotification } from '@/services/technicianApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { LevelBadge } from '@/components/common/LevelBadge';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function TechnicianDashboard() {
  const queryClient = useQueryClient();
  const [showNotifications, setShowNotifications] = useState(false);

  // Original dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ['technicianDashboard'],
    queryFn: dashboardApi.getTechnicianDashboard,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    refetchOnWindowFocus: true,
  });

  // Technician stats with points and levels
  const { data: techStats } = useQuery({
    queryKey: ['technicianStats'],
    queryFn: technicianApi.getDashboardStats,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });

  // Notifications
  const { data: notificationsData } = useQuery({
    queryKey: ['technicianNotifications'],
    queryFn: () => technicianApi.getNotifications(1, 5, false),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: technicianApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicianNotifications'] });
    },
  });

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const { assignedServices, completedServices, performanceStats } = data;
  const unreadCount = notificationsData?.unreadCount || 0;

  const statusColors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_PROGRESS: '#3b82f6',
    WAITING_PARTS: '#8b5cf6',
    COMPLETED: '#10b981',
    DELIVERED: '#06b6d4',
  };

  const handleNotificationClick = (notification: TechnicianNotification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s your performance overview.</p>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => {
                      technicianApi.markAllAsRead();
                      queryClient.invalidateQueries({ queryKey: ['technicianNotifications'] });
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsData?.notifications.length === 0 ? (
                  <p className="p-4 text-center text-gray-500 text-sm">No notifications</p>
                ) : (
                  notificationsData?.notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notif.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.isRead && (
                          <span className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Level & Points Banner */}
      {techStats && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-yellow-300" />
              </div>
              <div>
                {techStats.profile.currentLevel && (
                  <div className="mb-1">
                    <LevelBadge
                      name={techStats.profile.currentLevel.name}
                      badgeColor={techStats.profile.currentLevel.badgeColor}
                      size="md"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <Link to="/branch/points-history" className="flex items-center gap-1 hover:underline">
                    <Zap className="w-4 h-4" />
                    {techStats.profile.totalPoints.toLocaleString()} Total Points
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  {techStats.thisMonth.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-300" />
                      {techStats.thisMonth.averageRating.toFixed(1)} Rating
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Level Progress */}
            {techStats.profile.nextLevel && (
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>Progress to {techStats.profile.nextLevel.name}</span>
                  <span>{techStats.profile.pointsToNextLevel.toLocaleString()} pts to go</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${techStats.profile.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Pending Tasks"
          value={performanceStats.pending}
          icon={Clock}
          iconColor="text-orange-600"
          iconBg="bg-orange-100"
        />
        <StatCard
          title="In Progress"
          value={performanceStats.inProgress}
          icon={Wrench}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Waiting for Parts"
          value={performanceStats.waitingParts}
          icon={Package}
          iconColor="text-purple-600"
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Completed"
          value={performanceStats.completed}
          icon={ClipboardCheck}
          iconColor="text-green-600"
          iconBg="bg-green-100"
        />
      </div>

      {/* Monthly Stats */}
      {techStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">This Month Completed</p>
                <p className="text-xl font-bold text-gray-900">{techStats.thisMonth.servicesCompleted}</p>
              </div>
            </div>
          </div>
          <Link
            to="/branch/points-history"
            className="bg-white rounded-xl p-4 border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <Zap className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Points Earned This Month</p>
                  <p className="text-xl font-bold text-gray-900">{techStats.thisMonth.totalPoints.toLocaleString()}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </Link>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today&apos;s Progress</p>
                <p className="text-xl font-bold text-gray-900">
                  {techStats.today.completed}/{techStats.today.pending + techStats.today.completed}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Assigned Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Active Service Requests</h2>
              <span className="text-sm text-gray-600">{assignedServices.length} tasks</span>
            </div>
            <div className="space-y-4">
              {assignedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No active tasks assigned to you</p>
              ) : (
                assignedServices.map((service: any) => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">{service.ticketNumber}</span>
                        <span
                          className="px-2 py-1 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${statusColors[service.status] || '#9ca3af'}20`,
                            color: statusColors[service.status] || '#9ca3af',
                          }}
                        >
                          {service.status.replace('_', ' ')}
                        </span>
                        {service.serviceCategory?.technicianPoints && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{service.serviceCategory.technicianPoints} pts
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/services/${service.id}`}
                        className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Customer</p>
                        <p className="font-medium text-gray-900">{service.customer?.name}</p>
                        <p className="text-gray-600 text-xs">{service.customer?.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-xs mb-1">Device</p>
                        <p className="font-medium text-gray-900">{service.deviceModel || 'Not specified'}</p>
                      </div>
                    </div>

                    {service.issue && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-xs mb-1">Issue Description</p>
                        <p className="text-sm text-gray-700 line-clamp-2">{service.issue}</p>
                      </div>
                    )}

                    {service.partsUsed && service.partsUsed.length > 0 && (
                      <div className="mt-3">
                        <p className="text-gray-600 text-xs mb-1">Parts Used</p>
                        <div className="flex flex-wrap gap-2">
                          {service.partsUsed.map((partUsed: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {partUsed.part?.name} (x{partUsed.quantity})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <Link
                        to={`/services/${service.id}`}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors text-center"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Recently Completed & Performance */}
        <div className="space-y-6">
          {/* Recently Completed */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-800">Recently Completed</h2>
              <ClipboardCheck className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {completedServices.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">No completed tasks yet</p>
              ) : (
                completedServices.map((service: any) => (
                  <div key={service.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{service.ticketNumber}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{service.customer?.name}</p>
                    {service.serviceCategory?.technicianPoints && (
                      <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        +{service.serviceCategory.technicianPoints} points earned
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Performance Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Assigned</span>
                <span className="text-lg font-bold text-gray-900">{performanceStats.totalAssigned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-lg font-bold text-green-600">{performanceStats.completed}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${
                      performanceStats.totalAssigned > 0
                        ? (performanceStats.completed / performanceStats.totalAssigned) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {performanceStats.totalAssigned > 0
                  ? `${Math.round((performanceStats.completed / performanceStats.totalAssigned) * 100)}% completion rate`
                  : 'No tasks assigned yet'}
              </p>
            </div>
          </div>

          {/* Points Info Card */}
          {techStats && techStats.profile.currentLevel && (
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-100">
              <h3 className="font-semibold text-gray-900 mb-3">Level Benefits</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Points Multiplier</span>
                  <span className="font-medium text-purple-600">
                    {techStats.profile.currentLevel.pointsMultiplier}x
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Incentive</span>
                  <span className="font-medium text-green-600">
                    {techStats.profile.currentLevel.incentivePercent}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </DashboardLayout>
  );
}
