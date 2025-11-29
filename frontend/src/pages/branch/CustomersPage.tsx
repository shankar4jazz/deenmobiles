import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { customerApi } from '@/services/customerApi';
import AddCustomerModal from '@/components/branch/AddCustomerModal';
import EditCustomerModal from '@/components/branch/EditCustomerModal';
import * as XLSX from 'xlsx';
import {
  Users,
  UserPlus,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Loader2,
  Search,
  Edit,
  Trash2,
  FileText,
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  Eye,
  PhoneCall,
  Download,
} from 'lucide-react';
import { Customer } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CustomersPage() {
  const user = useAuthStore((state) => state.user);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCustomerId, setEditCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Use the active branch ID from global auth store
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';

  // Fetch customers
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', branchId, searchQuery, currentPage],
    queryFn: () =>
      customerApi.getAllCustomers({
        branchId,
        search: searchQuery || undefined,
        page: currentPage,
        limit: 10,
      }),
    enabled: !!branchId,
  });

  const customers = data?.customers || [];
  const pagination = data?.pagination;

  // Calculate total services
  const totalServices = customers.reduce((sum, customer) => sum + (customer._count?.services || 0), 0);

  // Handle edit customer
  const handleEdit = (customerId: string) => {
    setEditCustomerId(customerId);
    setShowEditModal(true);
  };

  // Handle delete customer
  const handleDelete = async (customerId: string, customerName: string) => {
    if (
      confirm(
        `Are you sure you want to delete ${customerName}? This action cannot be undone.`
      )
    ) {
      try {
        await customerApi.deleteCustomer(customerId);
        alert('Customer deleted successfully');
        refetch();
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete customer');
      }
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'WhatsApp', 'Email', 'Address', 'Total Services'];
    const rows = customers.map((customer) => [
      customer.name,
      customer.phone,
      customer.whatsappNumber || '-',
      customer.email || '-',
      customer.address || '-',
      customer._count?.services || 0,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Export to Excel
  const exportToExcel = () => {
    const data = customers.map((customer) => ({
      'Name': customer.name,
      'Phone': customer.phone,
      'WhatsApp': customer.whatsappNumber || '-',
      'Email': customer.email || '-',
      'Address': customer.address || '-',
      'Total Services': customer._count?.services || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Name
      { wch: 15 }, // Phone
      { wch: 15 }, // WhatsApp
      { wch: 25 }, // Email
      { wch: 40 }, // Address
      { wch: 15 }, // Total Services
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `customers_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
            <p className="text-gray-600">Loading customers...</p>
          </div>
        </div>
      </>
    );
  }

  if (!branchId) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Branch Not Found</h2>
            <p className="text-gray-600 mt-2">You are not assigned to any branch.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-7 w-7 text-purple-600" />
              Customers
            </h1>
            <p className="text-gray-600 mt-1 text-sm">Manage customer information</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <button
              onClick={exportToCSV}
              disabled={customers.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to CSV"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              disabled={customers.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export to Excel"
            >
              <Download className="h-4 w-4" />
              Excel
            </button>

            {/* Add Customer Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-lg hover:from-purple-700 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              <UserPlus className="h-4 w-4" />
              Add New Customer
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Customers */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs">Total Customers</p>
                <p className="text-2xl font-bold mt-1">{pagination?.total || 0}</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Current Page Customers */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-xs">This Page</p>
                <p className="text-2xl font-bold mt-1">{customers.length}</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Total Services */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs">Total Services</p>
                <p className="text-2xl font-bold mt-1">{totalServices}</p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Average Services */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-xs">Avg Services/Customer</p>
                <p className="text-2xl font-bold mt-1">
                  {customers.length > 0 ? (totalServices / customers.length).toFixed(1) : '0'}
                </p>
              </div>
              <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Services
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No customers found</p>
                      {searchQuery && (
                        <p className="text-xs text-gray-400 mt-1">
                          Try adjusting your search
                        </p>
                      )}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer: Customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {customer.name}
                            </p>
                            {customer.email && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {customer.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-900 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {customer.phone}
                          </p>
                          {customer.whatsappNumber && (
                            <p className="text-xs text-green-600 flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {customer.whatsappNumber}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {customer.address ? (
                          <p className="text-xs text-gray-600 flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5 text-gray-400 flex-shrink-0" />
                            <span className="line-clamp-2">{customer.address}</span>
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          <FileText className="h-3 w-3" />
                          {customer._count?.services || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => alert('View details modal coming soon')}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Call */}
                          <a
                            href={`tel:${customer.phone}`}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Call customer"
                          >
                            <PhoneCall className="h-4 w-4" />
                          </a>

                          {/* WhatsApp */}
                          {customer.whatsappNumber && (
                            <a
                              href={`https://wa.me/91${customer.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-4 w-4" />
                            </a>
                          )}

                          {/* Email */}
                          {customer.email && (
                            <a
                              href={`mailto:${customer.email}`}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Send email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(customer.id)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Edit customer"
                          >
                            <Edit className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(customer.id, customer.name)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete customer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-xs text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> customers
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1)
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddCustomerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        branchId={branchId}
        branchName={branchName}
      />

      {editCustomerId && (
        <EditCustomerModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditCustomerId('');
          }}
          customerId={editCustomerId}
        />
      )}
    </>
  );
}
