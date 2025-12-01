import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceApi, ServiceStatus } from '@/services/serviceApi';
import { useAuthStore } from '@/store/authStore';
import PartsManagement from '@/components/services/PartsManagement';
import TechnicianAssignment from '@/components/services/TechnicianAssignment';
import ServiceHistoryTimeline from '@/components/services/ServiceHistoryTimeline';
import JobSheetButton from '@/components/services/JobSheetButton';
import InvoiceButton from '@/components/services/InvoiceButton';
import {
  ArrowLeft, Edit, Save, X, Camera, Package, Clock, User, Phone,
  Mail, Smartphone, FileText, DollarSign, Calendar, CheckCircle, AlertCircle, Trash2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Lock, Grid3X3, ClipboardList, Shield,
} from 'lucide-react';

const STATUS_COLORS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [ServiceStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ServiceStatus.WAITING_PARTS]: 'bg-orange-100 text-orange-800',
  [ServiceStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ServiceStatus.DELIVERED]: 'bg-purple-100 text-purple-800',
  [ServiceStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<ServiceStatus, string> = {
  [ServiceStatus.PENDING]: 'Pending',
  [ServiceStatus.IN_PROGRESS]: 'In Progress',
  [ServiceStatus.WAITING_PARTS]: 'Waiting Parts',
  [ServiceStatus.COMPLETED]: 'Completed',
  [ServiceStatus.DELIVERED]: 'Delivered',
  [ServiceStatus.CANCELLED]: 'Cancelled',
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [isEditingDiagnosis, setIsEditingDiagnosis] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<ServiceStatus | ''>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDeviceImages, setUploadingDeviceImages] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);
  const [deletingDeviceImageId, setDeletingDeviceImageId] = useState<string | null>(null);

  // Photo viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImages, setViewerImages] = useState<{ id: string; imageUrl: string; caption?: string }[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Fetch service details
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', id],
    queryFn: () => serviceApi.getServiceById(id!),
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update diagnosis mutation
  const updateDiagnosisMutation = useMutation({
    mutationFn: () => serviceApi.updateDiagnosis(id!, diagnosis, estimatedCost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setIsEditingDiagnosis(false);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: ServiceStatus) => serviceApi.updateServiceStatus(id!, status, statusNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setSelectedStatus('');
      setStatusNotes('');
    },
  });

  // Upload service images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => serviceApi.uploadServiceImages(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setUploadingImages(false);
    },
    onError: () => {
      setUploadingImages(false);
    },
  });

  // Upload device images mutation
  const uploadDeviceImagesMutation = useMutation({
    mutationFn: (files: File[]) => serviceApi.uploadDeviceImages(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setUploadingDeviceImages(false);
    },
    onError: () => {
      setUploadingDeviceImages(false);
    },
  });

  // Delete service image mutation
  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) => serviceApi.deleteServiceImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setDeletingImageId(null);
    },
    onError: () => {
      setDeletingImageId(null);
    },
  });

  // Delete device image mutation
  const deleteDeviceImageMutation = useMutation({
    mutationFn: (imageId: string) => serviceApi.deleteDeviceImage(id!, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setDeletingDeviceImageId(null);
    },
    onError: () => {
      setDeletingDeviceImageId(null);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadingImages(true);
      uploadImagesMutation.mutate(files);
    }
  };

  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadingDeviceImages(true);
      uploadDeviceImagesMutation.mutate(files);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setDeletingImageId(imageId);
    deleteImageMutation.mutate(imageId);
  };

  const handleDeleteDeviceImage = (imageId: string) => {
    setDeletingDeviceImageId(imageId);
    deleteDeviceImageMutation.mutate(imageId);
  };

  // Photo viewer handlers
  const openPhotoViewer = (images: { id: string; imageUrl: string; caption?: string }[], startIndex: number) => {
    setViewerImages(images);
    setCurrentImageIndex(startIndex);
    setZoomLevel(1);
    setViewerOpen(true);
  };

  const closePhotoViewer = () => {
    setViewerOpen(false);
    setViewerImages([]);
    setCurrentImageIndex(0);
    setZoomLevel(1);
  };

  const goToPrevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : viewerImages.length - 1));
    setZoomLevel(1);
  }, [viewerImages.length]);

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev < viewerImages.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
  }, [viewerImages.length]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleDownloadImage = () => {
    if (viewerImages[currentImageIndex]) {
      const imageUrl = getImageUrl(viewerImages[currentImageIndex].imageUrl);
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `image-${currentImageIndex + 1}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Keyboard navigation for photo viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!viewerOpen) return;

      switch (e.key) {
        case 'Escape':
          closePhotoViewer();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewerOpen, goToPrevImage, goToNextImage]);

  // Helper to get the correct image URL (S3 or local)
  const getImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${import.meta.env.VITE_API_BASE_URL}${imageUrl}`;
  };

  const handleSaveDiagnosis = () => {
    updateDiagnosisMutation.mutate();
  };

  const handleStatusUpdate = () => {
    if (selectedStatus) {
      updateStatusMutation.mutate(selectedStatus as ServiceStatus);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const canUpdateDiagnosis = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canUpdateStatus = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 mt-2">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">Service not found</p>
      </div>
    );
  }

  // Initialize diagnosis fields if editing
  if (isEditingDiagnosis && !diagnosis) {
    setDiagnosis(service.diagnosis || '');
    setEstimatedCost(service.estimatedCost);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/branch/services')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Details</h1>
            <p className="text-sm text-gray-500 mt-1">{service.ticketNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <JobSheetButton serviceId={service.id} variant="secondary" />
          <InvoiceButton serviceId={service.id} variant="primary" />
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
            {STATUS_LABELS[service.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Name</div>
                  <div className="font-medium text-gray-900">{service.customer?.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-500">Phone</div>
                  <div className="font-medium text-gray-900">{service.customer?.phoneNumber}</div>
                </div>
              </div>
              {service.customer?.email && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <div className="font-medium text-gray-900">{service.customer.email}</div>
                  </div>
                </div>
              )}
              {service.customer?.address && (
                <div className="flex items-start gap-3 col-span-2">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-sm text-gray-500">Address</div>
                    <div className="font-medium text-gray-900">{service.customer.address}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Device Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Device Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Model</div>
                <div className="font-medium text-gray-900">{service.deviceModel}</div>
              </div>
              {service.deviceIMEI && (
                <div>
                  <div className="text-sm text-gray-500">IMEI</div>
                  <div className="font-medium text-gray-900">{service.deviceIMEI}</div>
                </div>
              )}
            </div>
          </div>

          {/* Device Intake Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Device Intake Information
            </h2>

            {/* Row 1: Password, Pattern, Condition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Password/PIN */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Lock className="w-4 h-4" />
                  Password/PIN
                </div>
                <div className="font-mono text-gray-900">
                  {service.devicePassword || <span className="text-gray-400 italic font-normal">Not provided</span>}
                </div>
              </div>

              {/* Pattern Lock */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Grid3X3 className="w-4 h-4" />
                  Pattern Lock
                </div>
                <div className="font-mono text-gray-900">
                  {service.devicePattern ? (
                    service.devicePattern.split(',').join(' → ')
                  ) : (
                    <span className="text-gray-400 italic font-normal">Not provided</span>
                  )}
                </div>
              </div>

              {/* Device Condition */}
              <div>
                <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Device Condition
                </div>
                <div className="font-medium text-gray-900">
                  {service.condition?.name || <span className="text-gray-400 italic font-normal">Not provided</span>}
                </div>
                {service.condition?.description && (
                  <div className="text-xs text-gray-500 mt-1">{service.condition.description}</div>
                )}
              </div>
            </div>

            {/* Row 2: Accessories */}
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                <Package className="w-4 h-4" />
                Accessories Included
              </div>
              {service.accessories && service.accessories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {service.accessories.map((sa) => (
                    <span
                      key={sa.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                    >
                      {sa.accessory.name}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 italic">No accessories recorded</div>
              )}
            </div>

            {/* Row 3: Intake Notes */}
            <div>
              <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <FileText className="w-4 h-4" />
                Intake Notes
              </div>
              {service.intakeNotes ? (
                <div className="bg-gray-50 rounded-lg p-3 text-gray-700 whitespace-pre-wrap">
                  {service.intakeNotes}
                </div>
              ) : (
                <div className="text-gray-400 italic">Not provided</div>
              )}
            </div>
          </div>

          {/* Issue & Diagnosis */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Issue & Diagnosis</h2>
              {canUpdateDiagnosis && !isEditingDiagnosis && (
                <button
                  onClick={() => setIsEditingDiagnosis(true)}
                  className="flex items-center gap-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Reported Issue</div>
                <div className="text-gray-900">{service.issue}</div>
              </div>

              {isEditingDiagnosis ? (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnosis
                    </label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost
                    </label>
                    <input
                      type="number"
                      value={estimatedCost}
                      onChange={(e) => setEstimatedCost(parseFloat(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDiagnosis}
                      disabled={updateDiagnosisMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDiagnosis(false)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : service.diagnosis ? (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Diagnosis</div>
                  <div className="text-gray-900">{service.diagnosis}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-400 italic">No diagnosis yet</div>
              )}
            </div>
          </div>

          {/* Service Images */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Service Photos
              </h2>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                <Camera className="w-4 h-4" />
                Add Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingImages && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Uploading images...
              </div>
            )}

            {service.images && service.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {service.images.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.caption || 'Service image'}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openPhotoViewer(service.images!, index)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/50 rounded-full p-2">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      disabled={deletingImageId === image.id}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      title="Delete image"
                    >
                      {deletingImageId === image.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No service photos uploaded yet
              </div>
            )}
          </div>

          {/* Device Images */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Device Photos
              </h2>
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
                <Camera className="w-4 h-4" />
                Add Device Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleDeviceImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {uploadingDeviceImages && (
              <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
                Uploading device images...
              </div>
            )}

            {service.deviceImages && service.deviceImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {service.deviceImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.caption || 'Device image'}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openPhotoViewer(service.deviceImages!, index)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/50 rounded-full p-2">
                        <ZoomIn className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeviceImage(image.id);
                      }}
                      disabled={deletingDeviceImageId === image.id}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                      title="Delete image"
                    >
                      {deletingDeviceImageId === image.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No device photos uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Update */}
          {canUpdateStatus && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Update Status</h3>
              <div className="space-y-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as ServiceStatus)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select new status</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value} disabled={value === service.status}>
                      {label}
                    </option>
                  ))}
                </select>
                {selectedStatus && (
                  <>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add notes (optional)"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updateStatusMutation.isPending}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Update Status
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Technician Assignment */}
          <TechnicianAssignment
            serviceId={service.id}
            currentAssignee={service.assignedTo}
            canAssign={user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
          />

          {/* Pricing Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Estimated Cost</span>
                <span className="font-semibold">₹{service.estimatedCost.toFixed(2)}</span>
              </div>
              {service.actualCost && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual Cost</span>
                  <span className="font-semibold">₹{service.actualCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-green-600">
                <span>Advance Paid</span>
                <span className="font-semibold">₹{service.advancePayment.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-200 flex justify-between">
                <span className="font-semibold">Balance Due</span>
                <span className="font-semibold text-lg">
                  ₹{((service.actualCost || service.estimatedCost) - service.advancePayment).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Parts Management */}
          <PartsManagement
            serviceId={service.id}
            parts={service.partsUsed || []}
            canEdit={user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
          />

          {/* Service History Timeline */}
          <ServiceHistoryTimeline serviceId={service.id} />
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {viewerOpen && viewerImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closePhotoViewer}
        >
          {/* Close button */}
          <button
            onClick={closePhotoViewer}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors z-10"
            title="Close (Esc)"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Top toolbar */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg px-4 py-2">
            <span className="text-white text-sm">
              {currentImageIndex + 1} / {viewerImages.length}
            </span>
            <div className="w-px h-5 bg-white/30 mx-2" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoomLevel <= 0.5}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom out (-)"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white text-sm min-w-[50px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoomLevel >= 3}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom in (+)"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="w-px h-5 bg-white/30 mx-2" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage();
              }}
              className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>

          {/* Previous button */}
          {viewerImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevImage();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 text-white/80 hover:text-white rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              title="Previous (Left Arrow)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Image container */}
          <div
            className="flex items-center justify-center w-full h-full p-16 overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(viewerImages[currentImageIndex].imageUrl)}
              alt={viewerImages[currentImageIndex].caption || `Image ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
              draggable={false}
            />
          </div>

          {/* Next button */}
          {viewerImages.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNextImage();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 text-white/80 hover:text-white rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              title="Next (Right Arrow)"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnail strip */}
          {viewerImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
              {viewerImages.map((image, index) => (
                <button
                  key={image.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                    setZoomLevel(1);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentImageIndex
                      ? 'border-white opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-80'
                  }`}
                >
                  <img
                    src={getImageUrl(image.imageUrl)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
