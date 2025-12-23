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
import { PatternDisplay } from '@/components/common/PatternDisplay';
import {
  ArrowLeft, Edit, Save, X, Camera, Clock,
  Smartphone, FileText, DollarSign, CheckCircle, Trash2,
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download,
  Pencil, Plus,
} from 'lucide-react';
import EditEstimatedCostModal from '@/components/services/EditEstimatedCostModal';
import AddPaymentModal from '@/components/services/AddPaymentModal';
import TechnicianNotes from '@/components/services/TechnicianNotes';
import { toast } from 'sonner';

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
  const [showEditEstimatedModal, setShowEditEstimatedModal] = useState(false);
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);
  const [isEditingLabour, setIsEditingLabour] = useState(false);
  const [labourCharge, setLabourCharge] = useState(0);

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
    refetchInterval: 30000,
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
      setShowStatusChange(false);
      toast.success('Status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
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

  // Update labour charge mutation
  const updateLabourChargeMutation = useMutation({
    mutationFn: (amount: number) => serviceApi.updateLabourCharge(id!, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setIsEditingLabour(false);
      toast.success('Labour charge updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update labour charge');
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

  const canUpdateDiagnosis = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const canUpdateStatus = user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
        <p className="text-gray-500 mt-2 text-sm">Loading service details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 text-sm">Service not found</p>
      </div>
    );
  }

  // Combine all images for unified grid
  const allServiceImages = service.images || [];
  const allDeviceImages = service.deviceImages || [];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* Header - Compact */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/branch/services')}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Service Details</h1>
            <p className="text-xs text-gray-500">{service.ticketNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <JobSheetButton serviceId={service.id} variant="secondary" />
          <InvoiceButton serviceId={service.id} variant="primary" />
          <span className={`px-3 py-1.5 text-xs font-semibold rounded-full ${STATUS_COLORS[service.status]}`}>
            {STATUS_LABELS[service.status]}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer & Device Info - Combined */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Customer & Device
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Customer</span>
                <p className="font-medium">{service.customer?.name}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Phone</span>
                <p className="font-medium">{service.customer?.phone}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Device</span>
                <p className="font-medium">{service.deviceModel}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">IMEI</span>
                <p className="font-medium">{service.deviceIMEI || '-'}</p>
              </div>
              {service.customer?.email && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Email</span>
                  <p className="font-medium">{service.customer.email}</p>
                </div>
              )}
              {service.customer?.address && (
                <div className="col-span-2">
                  <span className="text-gray-500 text-xs">Address</span>
                  <p className="font-medium text-gray-700">{service.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          {/* Reported Faults */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Reported Faults</h3>
            {service.faults && service.faults.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {service.faults.map((f: any) => (
                  <div
                    key={f.fault?.id || f.faultId}
                    className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <span className="font-medium text-red-700">{f.fault?.name || 'Unknown'}</span>
                    {f.fault?.defaultPrice > 0 && (
                      <span className="text-xs text-red-500">₹{f.fault.defaultPrice}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No faults recorded</p>
            )}
          </div>

          {/* Device Intake - Compact */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
              Device Intake
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
              {/* Password - compact */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="text-xs text-gray-500">Password/PIN</div>
                <div className="font-mono text-sm">
                  {service.devicePassword || <span className="text-gray-400">-</span>}
                </div>
              </div>
              {/* Pattern - smaller */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="text-xs text-gray-500 mb-1">Pattern</div>
                {service.devicePattern ? (
                  <PatternDisplay pattern={service.devicePattern} size={60} />
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </div>
              {/* Condition */}
              <div>
                <div className="text-xs text-gray-500">Condition</div>
                <div className="font-medium text-sm">
                  {service.deviceCondition
                    ? service.deviceCondition.charAt(0).toUpperCase() + service.deviceCondition.slice(1)
                    : <span className="text-gray-400 font-normal">-</span>}
                </div>
              </div>
              {/* Data Warranty */}
              <div>
                <div className="text-xs text-gray-500">Data Warranty</div>
                <div className="font-medium text-sm">
                  {service.dataWarrantyAccepted ? (
                    <span className="text-green-600">Accepted</span>
                  ) : (
                    <span className="text-red-600">Not Accepted</span>
                  )}
                </div>
              </div>
              {/* Customer Notification */}
              <div>
                <div className="text-xs text-gray-500">Notification</div>
                <div className="flex gap-2 text-sm">
                  {service.sendSmsNotification && (
                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">SMS</span>
                  )}
                  {service.sendWhatsappNotification && (
                    <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">WhatsApp</span>
                  )}
                  {!service.sendSmsNotification && !service.sendWhatsappNotification && (
                    <span className="text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
            {/* Accessories inline */}
            <div className="flex items-center gap-2 flex-wrap text-sm">
              <span className="text-gray-500 text-xs">Accessories:</span>
              {service.accessories && service.accessories.length > 0 ? (
                service.accessories.map((sa) => (
                  <span
                    key={sa.id}
                    className="px-2 py-0.5 bg-gray-100 rounded text-xs"
                  >
                    {sa.accessory.name}
                  </span>
                ))
              ) : (
                <span className="text-gray-400 text-xs">None</span>
              )}
            </div>
            {/* Intake notes - only if exists */}
            {service.intakeNotes && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                {service.intakeNotes}
              </div>
            )}
          </div>

          {/* Damage Condition & Diagnosis - Compact */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Damage Condition & Diagnosis
              </h3>
              {canUpdateDiagnosis && !isEditingDiagnosis && (
                <button
                  onClick={() => {
                    setDiagnosis(service.diagnosis || '');
                    setEstimatedCost(service.estimatedCost);
                    setIsEditingDiagnosis(true);
                  }}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700 text-xs font-medium"
                >
                  <Edit className="w-3 h-3" />
                  Edit
                </button>
              )}
            </div>

            {isEditingDiagnosis ? (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estimated Cost</label>
                  <input
                    type="number"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDiagnosis}
                    disabled={updateDiagnosisMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingDiagnosis(false)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <X className="w-3 h-3" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <p><span className="text-gray-500">Damage Condition:</span> {service.damageCondition}</p>
                <p><span className="text-gray-500">Diagnosis:</span> {service.diagnosis || <span className="text-gray-400 italic">Not yet diagnosed</span>}</p>
              </div>
            )}
          </div>

          {/* Parts Used */}
          <PartsManagement
            serviceId={service.id}
            parts={service.partsUsed || []}
            canEdit={user?.role === 'TECHNICIAN' || user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
          />

          {/* Technician Notes */}
          <TechnicianNotes serviceId={service.id} />

          {/* Photos - Combined */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Photos</h3>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs text-purple-600 cursor-pointer hover:text-purple-700">
                  <Camera className="w-3 h-3" />
                  + Service
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-1 text-xs text-purple-600 cursor-pointer hover:text-purple-700">
                  <Smartphone className="w-3 h-3" />
                  + Device
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDeviceImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {(uploadingImages || uploadingDeviceImages) && (
              <div className="mb-3 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                Uploading images...
              </div>
            )}

            {allServiceImages.length > 0 || allDeviceImages.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {/* Service Images */}
                {allServiceImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.caption || 'Service image'}
                      className="w-full h-20 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openPhotoViewer(allServiceImages, index)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/50 rounded-full p-1">
                        <ZoomIn className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      disabled={deletingImageId === image.id}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingImageId === image.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
                {/* Device Images - with blue border to differentiate */}
                {allDeviceImages.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.caption || 'Device image'}
                      className="w-full h-20 object-cover rounded border-2 border-blue-300 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openPhotoViewer(allDeviceImages, index)}
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-black/50 rounded-full p-1">
                        <ZoomIn className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeviceImage(image.id);
                      }}
                      disabled={deletingDeviceImageId === image.id}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    >
                      {deletingDeviceImageId === image.id ? (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-400 text-sm">
                No photos uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Compact */}
        <div className="space-y-4">
          {/* Status Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Service Status</h3>

            {/* Current Status Display */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLORS[service.status]}`}>
                {STATUS_LABELS[service.status]}
              </span>
              {canUpdateStatus && !showStatusChange && (
                <button
                  onClick={() => setShowStatusChange(true)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  Change Status
                </button>
              )}
            </div>

            {/* Booked By */}
            {service.createdBy && (
              <div className="mb-3 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">Booked By</span>
                <p className="text-sm font-medium text-gray-900">{service.createdBy.name}</p>
              </div>
            )}

            {/* Status Change Form */}
            {canUpdateStatus && showStatusChange && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">New Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as ServiceStatus)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    autoFocus
                  >
                    <option value="">Select new status</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value} disabled={value === service.status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStatus && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                    <textarea
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Add notes about this status change..."
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowStatusChange(false);
                      setSelectedStatus('');
                      setStatusNotes('');
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!selectedStatus || updateStatusMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Technician Assignment */}
          <TechnicianAssignment
            serviceId={service.id}
            branchId={service.branchId}
            currentAssignee={service.assignedTo}
            canAssign={user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'}
          />

          {/* Pricing - Compact */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Pricing
            </h3>
            {(() => {
              // Calculate parts total
              const partsTotal = (service.partsUsed || []).reduce(
                (sum, part) => sum + part.totalPrice,
                0
              );
              const currentLabourCharge = service.labourCharge || 0;
              const actualTotal = partsTotal + currentLabourCharge;
              const balance = actualTotal - service.advancePayment;

              return (
                <div className="text-sm space-y-1">
                  {/* Estimated - with edit button */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estimated</span>
                    <div className="flex items-center gap-1">
                      <span>₹{service.estimatedCost.toFixed(2)}</span>
                      {(user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TECHNICIAN') && (
                        <button
                          onClick={() => setShowEditEstimatedModal(true)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit estimated cost"
                        >
                          <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="border-t border-dashed border-gray-200 my-2" />

                  {/* Parts - from parts used */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Parts</span>
                    <span>₹{partsTotal.toFixed(2)}</span>
                  </div>

                  {/* Labour - with edit button */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Labour</span>
                    {isEditingLabour ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={labourCharge}
                          onChange={(e) => setLabourCharge(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateLabourChargeMutation.mutate(labourCharge);
                            } else if (e.key === 'Escape') {
                              setIsEditingLabour(false);
                            }
                          }}
                        />
                        <button
                          onClick={() => updateLabourChargeMutation.mutate(labourCharge)}
                          disabled={updateLabourChargeMutation.isPending}
                          className="p-1 hover:bg-green-100 rounded text-green-600"
                          title="Save"
                        >
                          <Save className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setIsEditingLabour(false)}
                          className="p-1 hover:bg-gray-100 rounded text-gray-500"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>₹{currentLabourCharge.toFixed(2)}</span>
                        {(user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'TECHNICIAN') && (
                          <button
                            onClick={() => {
                              setLabourCharge(currentLabourCharge);
                              setIsEditingLabour(true);
                            }}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit labour charge"
                          >
                            <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="border-t border-dashed border-gray-200 my-2" />

                  {/* Actual Total */}
                  <div className="flex justify-between font-medium">
                    <span className="text-gray-700">Actual Total</span>
                    <span>₹{actualTotal.toFixed(2)}</span>
                  </div>

                  {/* Advance */}
                  <div className="flex justify-between text-green-600">
                    <span>Advance</span>
                    <span>₹{service.advancePayment.toFixed(2)}</span>
                  </div>

                  {/* Balance */}
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Balance</span>
                    <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      ₹{balance.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Add Payment Button */}
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'RECEPTIONIST') && (
              <button
                onClick={() => setShowAddPaymentModal(true)}
                className="w-full mt-3 py-2 px-3 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg border border-green-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Payment
              </button>
            )}

            {/* Payment History */}
            {service.paymentEntries && service.paymentEntries.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Payment History</h4>
                <div className="space-y-1.5 text-xs max-h-32 overflow-y-auto">
                  {service.paymentEntries.map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center text-gray-600">
                      <div>
                        <span className="font-medium text-green-600">₹{entry.amount.toFixed(2)}</span>
                        <span className="text-gray-400 ml-1">via {entry.paymentMethod?.name || 'N/A'}</span>
                      </div>
                      <span className="text-gray-400">
                        {new Date(entry.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
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

      {/* Edit Estimated Cost Modal */}
      <EditEstimatedCostModal
        isOpen={showEditEstimatedModal}
        onClose={() => setShowEditEstimatedModal(false)}
        serviceId={service.id}
        currentValue={service.estimatedCost}
      />

      {/* Add Payment Modal */}
      <AddPaymentModal
        isOpen={showAddPaymentModal}
        onClose={() => setShowAddPaymentModal(false)}
        serviceId={service.id}
      />
    </div>
  );
}
