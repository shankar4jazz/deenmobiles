import { useState } from 'react';
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
  Mail, Smartphone, FileText, DollarSign, Calendar, CheckCircle, AlertCircle,
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

  // Upload images mutation
  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => serviceApi.uploadServiceImages(id!, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service', id] });
      setUploadingImages(false);
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadingImages(true);
      uploadImagesMutation.mutate(files);
    }
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
              {service.devicePassword && (
                <div className="col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 font-medium">Device Password</div>
                  <div className="font-mono text-yellow-900">{service.devicePassword}</div>
                </div>
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
                Device Photos
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
                {service.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${image.imageUrl}`}
                      alt={image.caption || 'Service image'}
                      className="w-full h-40 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No photos uploaded yet
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
    </div>
  );
}
