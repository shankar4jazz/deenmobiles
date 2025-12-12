import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  technicianApi,
  TechnicianProfile,
  TechnicianLevel,
  TechnicianSkill,
  PromotionCandidate,
} from '@/services/technicianApi';
import { branchApi } from '@/services/branchApi';
import { faultApi } from '@/services/masterDataApi';
import { LevelBadge } from '@/components/common/LevelBadge';
import {
  Users,
  Award,
  TrendingUp,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Star,
  Filter,
  AlertCircle,
  CheckCircle,
  X,
  Wrench,
  BadgeCheck,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'technicians' | 'levels' | 'promotions' | 'skills';

export default function TechnicianManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('technicians');
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showAdjustPointsModal, setShowAdjustPointsModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<TechnicianLevel | null>(null);
  const [selectedTechnician, setSelectedTechnician] = useState<TechnicianProfile | null>(null);
  const [pointsAdjustment, setPointsAdjustment] = useState({ points: 0, reason: '' });
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [skillTechnician, setSkillTechnician] = useState<TechnicianProfile | null>(null);
  const [editingSkill, setEditingSkill] = useState<TechnicianSkill | null>(null);

  // Fetch technicians
  const { data: techniciansData, isLoading: techniciansLoading } = useQuery({
    queryKey: ['technicians', branchFilter, availabilityFilter, levelFilter, searchQuery, page],
    queryFn: () =>
      technicianApi.getAllTechnicians(
        {
          branchId: branchFilter || undefined,
          isAvailable: availabilityFilter ? availabilityFilter === 'true' : undefined,
          levelId: levelFilter || undefined,
          search: searchQuery || undefined,
        },
        page,
        10
      ),
    enabled: activeTab === 'technicians',
  });

  // Fetch levels
  const { data: levelsData, isLoading: levelsLoading } = useQuery({
    queryKey: ['technician-levels'],
    queryFn: technicianApi.getLevels,
  });

  // Fetch branches for filter
  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchApi.getAllBranches(),
  });

  // Fetch promotion candidates
  const { data: promotionCandidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['promotion-candidates'],
    queryFn: technicianApi.getPromotionCandidates,
    enabled: activeTab === 'promotions',
  });

  // Fetch technicians with skills for skills tab
  const { data: techsWithSkillsData, isLoading: skillsLoading } = useQuery({
    queryKey: ['technicians-with-skills', branchFilter, searchQuery],
    queryFn: () =>
      technicianApi.getAllTechnicians(
        {
          branchId: branchFilter || undefined,
          search: searchQuery || undefined,
        },
        1,
        100
      ),
    enabled: activeTab === 'skills',
  });

  // Fetch faults for skill options
  const { data: faultsData } = useQuery({
    queryKey: ['faults'],
    queryFn: () => faultApi.getAll({ isActive: true, limit: 100 }),
    enabled: activeTab === 'skills' || showAddSkillModal,
  });

  // Create level mutation
  const createLevelMutation = useMutation({
    mutationFn: technicianApi.createLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-levels'] });
      setShowLevelModal(false);
      setEditingLevel(null);
      toast.success('Level created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create level');
    },
  });

  // Update level mutation
  const updateLevelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TechnicianLevel> }) =>
      technicianApi.updateLevel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-levels'] });
      setShowLevelModal(false);
      setEditingLevel(null);
      toast.success('Level updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update level');
    },
  });

  // Delete level mutation
  const deleteLevelMutation = useMutation({
    mutationFn: technicianApi.deleteLevel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technician-levels'] });
      toast.success('Level deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete level');
    },
  });

  // Promote technician mutation
  const promoteMutation = useMutation({
    mutationFn: ({ userId, toLevelId, notes }: { userId: string; toLevelId: string; notes?: string }) =>
      technicianApi.promoteTechnician(userId, { toLevelId, notes }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotion-candidates'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success(`Technician promoted to ${data.toLevel.name}! +${data.bonusPoints} bonus points awarded.`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to promote technician');
    },
  });

  // Adjust points mutation
  const adjustPointsMutation = useMutation({
    mutationFn: ({ userId, points, reason }: { userId: string; points: number; reason: string }) =>
      technicianApi.adjustPoints(userId, { points, reason }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['promotion-candidates'] });
      setShowAdjustPointsModal(false);
      setSelectedTechnician(null);
      setPointsAdjustment({ points: 0, reason: '' });
      toast.success(`Points adjusted. New total: ${data.newTotalPoints}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to adjust points');
    },
  });

  // Initialize default levels mutation
  const initializeLevelsMutation = useMutation({
    mutationFn: technicianApi.initializeDefaultLevels,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['technician-levels'] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to initialize levels');
    },
  });

  // Add skill mutation
  const addSkillMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: { faultId: string; proficiencyLevel?: number } }) =>
      technicianApi.addSkill(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-with-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setShowAddSkillModal(false);
      setSkillTechnician(null);
      toast.success('Skill added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add skill');
    },
  });

  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: ({ skillId, data }: { skillId: string; data: { proficiencyLevel?: number; isVerified?: boolean } }) =>
      technicianApi.updateSkill(skillId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-with-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      setEditingSkill(null);
      toast.success('Skill updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update skill');
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: technicianApi.removeSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians-with-skills'] });
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      toast.success('Skill removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove skill');
    },
  });

  const handleLevelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      minPoints: parseInt(formData.get('minPoints') as string),
      maxPoints: formData.get('maxPoints') ? parseInt(formData.get('maxPoints') as string) : null,
      pointsMultiplier: parseFloat(formData.get('pointsMultiplier') as string),
      incentivePercent: parseFloat(formData.get('incentivePercent') as string),
      badgeColor: formData.get('badgeColor') as string,
      description: formData.get('description') as string,
      sortOrder: parseInt(formData.get('sortOrder') as string),
    };

    if (editingLevel) {
      updateLevelMutation.mutate({ id: editingLevel.id, data });
    } else {
      createLevelMutation.mutate(data);
    }
  };

  const handleDeleteLevel = (level: TechnicianLevel) => {
    if (level.technicianCount && level.technicianCount > 0) {
      toast.error('Cannot delete level with assigned technicians');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the "${level.name}" level?`)) {
      deleteLevelMutation.mutate(level.id);
    }
  };

  const handlePromote = (candidate: PromotionCandidate) => {
    const notes = window.prompt('Add promotion notes (optional):');
    promoteMutation.mutate({
      userId: candidate.profile.userId,
      toLevelId: candidate.eligibleLevel.id,
      notes: notes || undefined,
    });
  };

  const handleAdjustPoints = () => {
    if (!selectedTechnician || !pointsAdjustment.reason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }
    adjustPointsMutation.mutate({
      userId: selectedTechnician.userId,
      points: pointsAdjustment.points,
      reason: pointsAdjustment.reason,
    });
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'technicians', label: 'Technicians', icon: <Users className="w-4 h-4" /> },
    { id: 'levels', label: 'Levels', icon: <Award className="w-4 h-4" /> },
    { id: 'promotions', label: 'Promotions', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'skills', label: 'Skills', icon: <Wrench className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Technician Management</h1>
          <p className="text-gray-600 mt-1">Manage technicians, levels, and promotions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Technicians Tab */}
      {activeTab === 'technicians' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search technicians..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branchesData?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                {levelsData?.levels.map((level: TechnicianLevel) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>

              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                <option value="true">Available</option>
                <option value="false">Busy</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setBranchFilter('');
                  setLevelFilter('');
                  setAvailabilityFilter('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Technicians Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {techniciansLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : techniciansData?.technicians.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No technicians found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Technician
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {techniciansData?.technicians.map((tech: TechnicianProfile) => (
                        <tr key={tech.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {tech.user.profileImage ? (
                                  <img
                                    src={tech.user.profileImage}
                                    alt={tech.user.name}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <span className="text-purple-600 font-semibold">
                                      {tech.user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{tech.user.name}</div>
                                <div className="text-sm text-gray-500">{tech.user.email}</div>
                                {tech.branch && (
                                  <div className="text-xs text-gray-400">{tech.branch.name}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {tech.currentLevel ? (
                              <LevelBadge
                                name={tech.currentLevel.name}
                                badgeColor={tech.currentLevel.badgeColor}
                                size="sm"
                              />
                            ) : (
                              <span className="text-gray-400 text-sm">No level</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {tech.totalPoints.toLocaleString()} pts
                            </div>
                            {tech.nextLevel && tech.pointsToNextLevel !== undefined && (
                              <div className="text-xs text-gray-500">
                                {tech.pointsToNextLevel.toLocaleString()} to {tech.nextLevel.name}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-1">
                              {tech.averageRating && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span>{tech.averageRating.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500">
                                {tech.totalServicesCompleted} completed
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                tech.isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tech.isAvailable ? 'Available' : 'Busy'}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {tech.pendingServicesCount || 0}/{tech.maxConcurrentJobs} jobs
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedTechnician(tech);
                                setShowAdjustPointsModal(true);
                              }}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Adjust Points"
                            >
                              <Settings className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {techniciansData && techniciansData.pagination.totalPages > 1 && (
                  <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-700">
                      Page {techniciansData.pagination.page} of {techniciansData.pagination.totalPages} (
                      {techniciansData.pagination.total} total)
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === techniciansData.pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Levels Tab */}
      {activeTab === 'levels' && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Define technician levels with points thresholds and incentives
            </div>
            <div className="flex gap-2">
              {(!levelsData?.levels || levelsData.levels.length === 0) && (
                <button
                  onClick={() => initializeLevelsMutation.mutate()}
                  disabled={initializeLevelsMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {initializeLevelsMutation.isPending ? (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  Initialize Default Levels
                </button>
              )}
              <button
                onClick={() => {
                  setEditingLevel(null);
                  setShowLevelModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Level
              </button>
            </div>
          </div>

          {/* Levels Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {levelsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : levelsData?.levels.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Award className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No levels defined</p>
                <p className="text-sm">Click "Initialize Default Levels" to create standard levels</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Points Range
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Multiplier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Incentive
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Technicians
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {levelsData?.levels
                      .sort((a: TechnicianLevel, b: TechnicianLevel) => a.sortOrder - b.sortOrder)
                      .map((level: TechnicianLevel) => (
                        <tr key={level.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <LevelBadge
                                name={level.name}
                                badgeColor={level.badgeColor}
                                size="md"
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{level.code}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {level.minPoints.toLocaleString()} - {level.maxPoints?.toLocaleString() || '∞'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {level.pointsMultiplier}x
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-green-600">
                              {level.incentivePercent}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              {level.technicianCount || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingLevel(level);
                                  setShowLevelModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit level"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteLevel(level)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete level"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Promotions Tab */}
      {activeTab === 'promotions' && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium">Promotion Candidates</p>
              <p className="mt-1">
                These technicians have earned enough points to be eligible for promotion.
                Review their performance and promote them to unlock higher incentives and multipliers.
              </p>
            </div>
          </div>

          {/* Candidates List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {candidatesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : !promotionCandidates?.candidates || promotionCandidates.candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <CheckCircle className="h-16 w-16 mb-4 text-green-300" />
                <p className="text-lg font-medium">No pending promotions</p>
                <p className="text-sm">All technicians are at their appropriate level</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {promotionCandidates.candidates.map((candidate: PromotionCandidate) => (
                  <div key={candidate.profile.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          {candidate.profile.user.profileImage ? (
                            <img
                              src={candidate.profile.user.profileImage}
                              alt={candidate.profile.user.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {candidate.profile.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-medium text-gray-900">
                            {candidate.profile.user.name}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Current:</span>
                              {candidate.currentLevel ? (
                                <LevelBadge
                                  name={candidate.currentLevel.name}
                                  badgeColor={candidate.currentLevel.badgeColor}
                                  size="sm"
                                />
                              ) : (
                                <span className="text-sm text-gray-400">None</span>
                              )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-500">Eligible:</span>
                              <LevelBadge
                                name={candidate.eligibleLevel.name}
                                badgeColor={candidate.eligibleLevel.badgeColor}
                                size="sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-purple-600">
                            {candidate.totalPoints.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            +{candidate.pointsAboveThreshold.toLocaleString()} above threshold
                          </div>
                        </div>
                        <button
                          onClick={() => handlePromote(candidate)}
                          disabled={promoteMutation.isPending}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                        >
                          {promoteMutation.isPending ? (
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          Promote
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
                      {candidate.profile.averageRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span>{candidate.profile.averageRating.toFixed(1)} rating</span>
                        </div>
                      )}
                      <div>{candidate.profile.totalServicesCompleted} services completed</div>
                      {candidate.profile.branch && (
                        <div>{candidate.profile.branch.name}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Wrench className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-700">
              <p className="font-medium">Skills Management</p>
              <p className="mt-1">
                Manage technician skills based on service categories. Skills help in assigning the right technician to the right job.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search technicians..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Branches</option>
                {branchesData?.branches?.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Technicians with Skills */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {skillsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : !techsWithSkillsData?.technicians || techsWithSkillsData.technicians.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Users className="h-16 w-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No technicians found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {techsWithSkillsData.technicians.map((tech: TechnicianProfile) => (
                  <div key={tech.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 h-12 w-12">
                          {tech.user.profileImage ? (
                            <img
                              src={tech.user.profileImage}
                              alt={tech.user.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-lg">
                                {tech.user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-medium text-gray-900">
                            {tech.user.name}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {tech.currentLevel && (
                              <LevelBadge
                                name={tech.currentLevel.name}
                                badgeColor={tech.currentLevel.badgeColor}
                                size="sm"
                              />
                            )}
                            {tech.branch && (
                              <span className="text-sm text-gray-500">{tech.branch.name}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSkillTechnician(tech);
                          setShowAddSkillModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Skill
                      </button>
                    </div>

                    {/* Skills */}
                    <div className="mt-4">
                      {tech.skills && tech.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tech.skills.map((skill: TechnicianSkill) => (
                            <div
                              key={skill.id}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg group"
                            >
                              <Wrench className="w-4 h-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {skill.fault?.name || 'Unknown'}
                              </span>

                              {/* Proficiency Level */}
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <div
                                    key={level}
                                    className={`w-2 h-2 rounded-full ${
                                      level <= (skill.proficiencyLevel || 3)
                                        ? 'bg-green-500'
                                        : 'bg-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>

                              {/* Verified Badge */}
                              {skill.isVerified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500" title="Verified" />
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingSkill(skill)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit skill"
                                >
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Remove this skill?')) {
                                      removeSkillMutation.mutate(skill.id);
                                    }
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  title="Remove skill"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No skills assigned yet</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Level Modal */}
      {showLevelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowLevelModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLevel ? 'Edit Level' : 'Create Level'}
                </h2>
                <button
                  onClick={() => {
                    setShowLevelModal(false);
                    setEditingLevel(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLevelSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingLevel?.name}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      name="code"
                      defaultValue={editingLevel?.code}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Points</label>
                    <input
                      type="number"
                      name="minPoints"
                      defaultValue={editingLevel?.minPoints ?? 0}
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Points <span className="text-gray-400">(empty = unlimited)</span>
                    </label>
                    <input
                      type="number"
                      name="maxPoints"
                      defaultValue={editingLevel?.maxPoints ?? ''}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points Multiplier</label>
                    <input
                      type="number"
                      name="pointsMultiplier"
                      defaultValue={editingLevel?.pointsMultiplier ?? 1}
                      step="0.1"
                      min="0.1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Incentive %</label>
                    <input
                      type="number"
                      name="incentivePercent"
                      defaultValue={editingLevel?.incentivePercent ?? 0}
                      step="0.5"
                      min="0"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Badge Color</label>
                    <input
                      type="color"
                      name="badgeColor"
                      defaultValue={editingLevel?.badgeColor || '#6B7280'}
                      className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      name="sortOrder"
                      defaultValue={editingLevel?.sortOrder ?? 1}
                      min="1"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    defaultValue={editingLevel?.description || ''}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLevelModal(false);
                      setEditingLevel(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLevelMutation.isPending || updateLevelMutation.isPending}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {(createLevelMutation.isPending || updateLevelMutation.isPending) ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </div>
                    ) : editingLevel ? (
                      'Update Level'
                    ) : (
                      'Create Level'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Points Modal */}
      {showAdjustPointsModal && selectedTechnician && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setShowAdjustPointsModal(false)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Adjust Points</h2>
                <button
                  onClick={() => {
                    setShowAdjustPointsModal(false);
                    setSelectedTechnician(null);
                    setPointsAdjustment({ points: 0, reason: '' });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">
                      {selectedTechnician.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedTechnician.user.name}</div>
                    <div className="text-sm text-gray-500">
                      Current: {selectedTechnician.totalPoints.toLocaleString()} points
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Adjustment
                  </label>
                  <input
                    type="number"
                    value={pointsAdjustment.points}
                    onChange={(e) =>
                      setPointsAdjustment({ ...pointsAdjustment, points: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter positive or negative value"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use positive value to add, negative to deduct
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pointsAdjustment.reason}
                    onChange={(e) =>
                      setPointsAdjustment({ ...pointsAdjustment, reason: e.target.value })
                    }
                    rows={3}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Explain the reason for this adjustment..."
                  />
                </div>

                {pointsAdjustment.points !== 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      New total will be:{' '}
                      <span className="font-semibold text-gray-900">
                        {(selectedTechnician.totalPoints + pointsAdjustment.points).toLocaleString()} points
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustPointsModal(false);
                    setSelectedTechnician(null);
                    setPointsAdjustment({ points: 0, reason: '' });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdjustPoints}
                  disabled={adjustPointsMutation.isPending || !pointsAdjustment.reason.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {adjustPointsMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Adjusting...
                    </div>
                  ) : (
                    'Apply Adjustment'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Skill Modal */}
      {showAddSkillModal && skillTechnician && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => {
              setShowAddSkillModal(false);
              setSkillTechnician(null);
            }} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add Skill</h2>
                <button
                  onClick={() => {
                    setShowAddSkillModal(false);
                    setSkillTechnician(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">
                      {skillTechnician.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{skillTechnician.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {skillTechnician.skills?.length || 0} skills
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  addSkillMutation.mutate({
                    userId: skillTechnician.userId,
                    data: {
                      faultId: formData.get('faultId') as string,
                      proficiencyLevel: parseInt(formData.get('proficiencyLevel') as string) || 3,
                    },
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fault (Skill)
                  </label>
                  <select
                    name="faultId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a fault</option>
                    {faultsData?.data
                      ?.filter((fault: any) => !skillTechnician.skills?.find((s: TechnicianSkill) => s.faultId === fault.id))
                      .map((fault: any) => (
                        <option key={fault.id} value={fault.id}>
                          {fault.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proficiency Level
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="proficiencyLevel"
                      min="1"
                      max="5"
                      defaultValue="3"
                      className="flex-1 accent-green-600"
                    />
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Gauge key={level} className="w-4 h-4 text-gray-300" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    1 = Beginner, 3 = Intermediate, 5 = Expert
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSkillModal(false);
                      setSkillTechnician(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSkillMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {addSkillMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Adding...
                      </div>
                    ) : (
                      'Add Skill'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Skill Modal */}
      {editingSkill && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setEditingSkill(null)} />
            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Skill</h2>
                <button
                  onClick={() => setEditingSkill(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-900">
                    {editingSkill.fault?.name || 'Unknown Skill'}
                  </span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  updateSkillMutation.mutate({
                    skillId: editingSkill.id,
                    data: {
                      proficiencyLevel: parseInt(formData.get('proficiencyLevel') as string) || 3,
                      isVerified: formData.get('isVerified') === 'on',
                    },
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Proficiency Level
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      name="proficiencyLevel"
                      min="1"
                      max="5"
                      defaultValue={editingSkill.proficiencyLevel || 3}
                      className="flex-1 accent-green-600"
                    />
                    <span className="text-sm font-medium text-gray-700 w-8 text-center">
                      {editingSkill.proficiencyLevel || 3}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isVerified"
                      defaultChecked={editingSkill.isVerified}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Verified Skill</span>
                      <p className="text-sm text-gray-500">
                        Mark this skill as verified by admin
                      </p>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingSkill(null)}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSkillMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {updateSkillMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </div>
                    ) : (
                      'Update Skill'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
