import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { serviceApi } from '@/services/serviceApi';
import { customerApi } from '@/services/customerApi';
import { invoiceApi } from '@/services/invoiceApi';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Search,
  Wrench,
  Users,
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'services' | 'customers' | 'invoices';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const branchId = user?.activeBranch?.id;

  const queryFromUrl = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(queryFromUrl);
  const [activeTab, setActiveTab] = useState<TabType>('services');

  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== queryFromUrl) {
      setSearchParams({ q: debouncedSearch });
    }
  }, [debouncedSearch, queryFromUrl, setSearchParams]);

  useEffect(() => {
    setSearchInput(queryFromUrl);
  }, [queryFromUrl]);

  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['search-services', queryFromUrl, branchId],
    queryFn: () =>
      serviceApi.getAllServices({
        search: queryFromUrl,
        branchId,
        limit: 10,
      }),
    enabled: !!queryFromUrl && !!branchId,
  });

  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ['search-customers', queryFromUrl, branchId],
    queryFn: () =>
      customerApi.getAllCustomers({
        search: queryFromUrl,
        branchId,
        limit: 10,
      }),
    enabled: !!queryFromUrl && !!branchId,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['search-invoices', queryFromUrl, branchId],
    queryFn: () =>
      invoiceApi.getAll({
        search: queryFromUrl,
        branchId,
        limit: 10,
      }),
    enabled: !!queryFromUrl && !!branchId,
  });

  const services = servicesData?.services || [];
  const customers = customersData?.customers || [];
  const invoices = invoicesData?.data || [];

  const tabs = [
    { id: 'services' as TabType, label: 'Services', icon: Wrench, count: services.length },
    { id: 'customers' as TabType, label: 'Customers', icon: Users, count: customers.length },
    { id: 'invoices' as TabType, label: 'Invoices', icon: FileText, count: invoices.length },
  ];

  const isLoading = servicesLoading || customersLoading || invoicesLoading;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
          {queryFromUrl && (
            <p className="text-sm text-gray-500 mt-1">
              Showing results for "{queryFromUrl}"
            </p>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search services, customers, invoices..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-100 outline-none"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs',
                activeTab === tab.id
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Results */}
      {!queryFromUrl ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Enter a search term to find results</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Services Tab */}
          {activeTab === 'services' && (
            <>
              {services.length === 0 ? (
                <EmptyState message="No services found" />
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Wrench className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {service.ticketNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {service.deviceModel} • {service.customer?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          service.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                          service.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-700',
                          service.status === 'WAITING_PARTS' && 'bg-orange-100 text-orange-700',
                          service.status === 'READY' && 'bg-green-100 text-green-700'
                        )}
                      >
                        {service.status.replace('_', ' ')}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <>
              {customers.length === 0 ? (
                <EmptyState message="No customers found" />
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => navigate(`/customers?view=${customer.id}`)}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            {customer.phone}
                          </span>
                          {customer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" />
                              {customer.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                ))
              )}
            </>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <>
              {invoices.length === 0 ? (
                <EmptyState message="No invoices found" />
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoice.service?.customer?.name} • ₹{invoice.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium',
                          invoice.paymentStatus === 'PAID' && 'bg-green-100 text-green-700',
                          invoice.paymentStatus === 'PARTIAL' && 'bg-yellow-100 text-yellow-700',
                          invoice.paymentStatus === 'PENDING' && 'bg-red-100 text-red-700'
                        )}
                      >
                        {invoice.paymentStatus}
                      </span>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <AlertCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500">{message}</p>
    </div>
  );
}
