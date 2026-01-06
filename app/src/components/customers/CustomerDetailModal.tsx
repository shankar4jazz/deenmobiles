import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  Smartphone,
  Receipt,
  Loader2,
  AlertCircle,
  Calendar,
  IndianRupee,
  ExternalLink,
  MessageCircle,
  CreditCard,
} from 'lucide-react';
import { customerApi } from '@/services/customerApi';
import { serviceApi, Service, ServiceStatus, DeliveryStatus } from '@/services/serviceApi';
import { customerDeviceApi } from '@/services/customerDeviceApi';
import { Customer, CustomerDevice } from '@/types';
import { useNavigate } from 'react-router-dom';

interface CustomerDetailModalProps {
  customerId: string;
  onClose: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getStatusBadge = (status: string) => {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
    IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'In Progress' },
    WAITING_PARTS: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Waiting Parts' },
    READY: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ready' },
    NOT_READY: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Ready' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
    DELIVERED: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Delivered' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' },
  };
  const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const getPaymentStatusBadge = (paid: number, total: number) => {
  const isPaid = paid >= total;
  const isPartial = paid > 0 && paid < total;

  if (isPaid) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Paid</span>;
  }
  if (isPartial) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Partial</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Pending</span>;
};

type TabType = 'info' | 'services' | 'invoices' | 'devices';

export default function CustomerDetailModal({ customerId, onClose }: CustomerDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const navigate = useNavigate();

  // Fetch customer details
  const { data: customer, isLoading: customerLoading, error: customerError } = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerApi.getCustomerById(customerId),
    enabled: !!customerId,
  });

  // Fetch services for customer
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['customer-services', customerId],
    queryFn: () => serviceApi.getAllServices({ customerId, limit: 100 }),
    enabled: !!customerId && activeTab === 'services',
  });

  // Fetch devices for customer
  const { data: devicesData, isLoading: devicesLoading } = useQuery({
    queryKey: ['customer-devices', customerId],
    queryFn: () => customerDeviceApi.getAllDevices(customerId, { limit: 100 }),
    enabled: !!customerId && activeTab === 'devices',
  });

  // Extract invoices from services (each service has payment entries)
  const invoices = servicesData?.services?.map((service) => ({
    id: service.id,
    ticketNumber: service.ticketNumber,
    deviceModel: service.deviceModel,
    totalAmount: service.estimatedCost || 0,
    paidAmount: (service.paymentEntries || []).reduce((sum, p) => sum + p.amount, 0),
    status: service.status,
    deliveryStatus: service.deliveryStatus,
    createdAt: service.createdAt,
    faults: service.faults,
  })) || [];

  const services = servicesData?.services || [];
  const devices = devicesData?.devices || [];

  // Handle keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (customerLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <p className="text-gray-600">Loading customer details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p>Failed to load customer details</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'info', label: 'Info', icon: <User className="h-4 w-4" /> },
    { id: 'services', label: 'Services', icon: <FileText className="h-4 w-4" />, count: customer._count?.services },
    { id: 'invoices', label: 'Invoices', icon: <Receipt className="h-4 w-4" />, count: invoices.length },
    { id: 'devices', label: 'Devices', icon: <Smartphone className="h-4 w-4" />, count: devices.length },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center text-lg font-semibold">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{customer.name}</h2>
              <p className="text-purple-100 text-sm flex items-center gap-2">
                <Phone className="h-3 w-3" />
                {customer.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Name</label>
                    <p className="text-gray-900 font-medium">{customer.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {customer.phone}
                    </p>
                  </div>
                  {customer.whatsappNumber && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">WhatsApp</label>
                      <p className="text-green-600 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        {customer.whatsappNumber}
                      </p>
                    </div>
                  )}
                  {customer.email && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Email</label>
                      <p className="text-gray-900 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {customer.email}
                      </p>
                    </div>
                  )}
                  {customer.address && (
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium text-gray-500">Address</label>
                      <p className="text-gray-900 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        {customer.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ID Proof */}
              {(customer.idProofType || customer.idProofDocument) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-600" />
                    ID Proof
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customer.idProofType && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">ID Type</label>
                          <p className="text-gray-900">{customer.idProofType}</p>
                        </div>
                      )}
                      {customer.idProofDocument && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">Document</label>
                          <a
                            href={`${API_URL}/uploads/${customer.idProofDocument}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 hover:text-purple-700 flex items-center gap-1"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Remarks */}
              {customer.remarks && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Remarks</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{customer.remarks}</p>
                  </div>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{customer._count?.services || 0}</p>
                  <p className="text-xs text-blue-600">Total Services</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{devices.length}</p>
                  <p className="text-xs text-green-600">Devices</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatDate(customer.createdAt)}
                  </p>
                  <p className="text-xs text-purple-600">Member Since</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {customer.branch?.name || '-'}
                  </p>
                  <p className="text-xs text-orange-600">Branch</p>
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div>
              {servicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No services found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {services.map((service) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <span className="font-mono text-sm text-purple-600">{service.ticketNumber}</span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-gray-900">{service.deviceModel}</p>
                            {service.deviceIMEI && (
                              <p className="text-xs text-gray-500">{service.deviceIMEI}</p>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(service.status)}
                              {service.deliveryStatus === 'DELIVERED' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Delivered
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm font-medium text-gray-900">{formatCurrency(service.estimatedCost)}</p>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-gray-600">{formatDate(service.createdAt)}</p>
                          </td>
                          <td className="px-3 py-3 text-right">
                            <button
                              onClick={() => {
                                onClose();
                                navigate(`/services/${service.id}`);
                              }}
                              className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              {servicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No invoices found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice#</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoices.map((invoice) => {
                        const balance = invoice.totalAmount - invoice.paidAmount;
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3">
                              <span className="font-mono text-sm text-purple-600">{invoice.ticketNumber}</span>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-sm text-gray-900">{invoice.deviceModel}</p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p className="text-sm font-medium text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p className="text-sm text-green-600">{formatCurrency(invoice.paidAmount)}</p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <p className={`text-sm font-medium ${balance > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                {formatCurrency(balance)}
                              </p>
                            </td>
                            <td className="px-3 py-3">
                              {getPaymentStatusBadge(invoice.paidAmount, invoice.totalAmount)}
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</p>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => {
                                  onClose();
                                  navigate(`/services/${invoice.id}`);
                                }}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={2} className="px-3 py-3 text-sm font-semibold text-gray-700">
                          Total ({invoices.length} invoices)
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-gray-900">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-green-600">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + inv.paidAmount, 0))}
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-bold text-red-600">
                          {formatCurrency(invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0))}
                        </td>
                        <td colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Devices Tab */}
          {activeTab === 'devices' && (
            <div>
              {devicesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
                </div>
              ) : devices.length === 0 ? (
                <div className="text-center py-12">
                  <Smartphone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No devices registered</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Brand/Model</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">IMEI</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Services</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Added</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {devices.map((device) => (
                        <tr key={device.id} className="hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Smartphone className="h-4 w-4 text-purple-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {device.brand?.name || '-'} {device.model?.name || '-'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-gray-900">{device.brand?.name || '-'}</p>
                            <p className="text-xs text-gray-500">{device.model?.name || '-'}</p>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-sm text-gray-600">{device.imei || '-'}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="text-sm text-gray-600">{device.color || '-'}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              <FileText className="h-3 w-3" />
                              {device._count?.services || 0}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <p className="text-sm text-gray-600">{formatDate(device.createdAt)}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
