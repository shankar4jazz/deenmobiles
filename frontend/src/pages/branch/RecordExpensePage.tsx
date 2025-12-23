import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi, pettyCashTransferApi } from '../../services/expenseApi';
import { masterDataApi } from '../../services/masterDataApi';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Wallet,
  Receipt,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  Upload,
  Paperclip,
  Image,
  FileText,
  Loader2,
} from 'lucide-react';
import { CreateExpenseDto, UpdateExpenseDto, Expense } from '../../types/expense';

export default function RecordExpensePage() {
  const { user } = useAuthStore();
  const branchId = user?.activeBranch?.id;
  const branchName = user?.activeBranch?.name || 'Branch';
  const queryClient = useQueryClient();

  // State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch branch balance
  const { data: balanceData } = useQuery({
    queryKey: ['branchBalance', branchId],
    queryFn: () => pettyCashTransferApi.getBranchBalance(branchId!),
    enabled: !!branchId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 60000, // 60 seconds
  });

  // Fetch expense categories
  const { data: categoriesData } = useQuery({
    queryKey: ['expenseCategories'],
    queryFn: () => masterDataApi.expenseCategories.getAll({ limit: 100, isActive: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes - categories rarely change
  });

  // Fetch expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', branchId, currentPage, searchTerm, selectedCategory],
    queryFn: () =>
      expenseApi.getAll({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        branchId: branchId!,
        categoryId: selectedCategory || undefined,
      }),
    enabled: !!branchId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Create expense mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateExpenseDto) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['branchBalance'] });
      queryClient.invalidateQueries({ queryKey: ['expenseDashboard'] });
      setIsModalOpen(false);
    },
  });

  // Update expense mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['branchBalance'] });
      queryClient.invalidateQueries({ queryKey: ['expenseDashboard'] });
      setIsModalOpen(false);
      setEditingExpense(null);
    },
  });

  // Delete expense mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['branchBalance'] });
      queryClient.invalidateQueries({ queryKey: ['expenseDashboard'] });
    },
  });

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ expenseId, file }: { expenseId: string; file: File }) =>
      expenseApi.uploadAttachment(expenseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: (expenseId: string) => expenseApi.deleteAttachment(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
    } else {
      setEditingExpense(null);
    }
    setIsModalOpen(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
    setIsViewModalOpen(true);
  };

  const handleDelete = (id: string, expenseNumber: string) => {
    if (window.confirm(`Are you sure you want to delete expense ${expenseNumber}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const currentBalance = balanceData?.currentBalance || 0;
  const balanceColor = currentBalance >= 0 ? 'text-green-600' : 'text-red-600';
  const balanceBgColor = currentBalance >= 0 ? 'bg-green-50' : 'bg-red-50';

  if (!branchId) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">No active branch selected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 pt-2 pb-6 space-y-4">
      {/* Header with Balance */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Record Expenses</h1>
          <p className="text-gray-600 mt-1">{branchName} - Expense Management</p>
        </div>
        <div className={`${balanceBgColor} border-2 ${currentBalance >= 0 ? 'border-green-200' : 'border-red-200'} rounded-xl p-4`}>
          <p className="text-sm font-medium text-gray-600 mb-1">Available Balance</p>
          <p className={`text-xl font-bold ${balanceColor}`}>
            ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => handleOpenModal()}
            disabled={currentBalance <= 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Record Expense
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categoriesData?.data.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : expensesData?.data.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No expenses recorded yet</p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
            >
              Record your first expense
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expense #
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expensesData?.data.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-medium text-purple-600">
                          {expense.expenseNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {format(new Date(expense.expenseDate), 'dd MMM yyyy')}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {expense.category?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 line-clamp-2 max-w-md">
                          {expense.description}
                        </p>
                        {expense.vendorName && (
                          <p className="text-xs text-gray-500 mt-1">
                            Vendor: {expense.vendorName}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewExpense(expense)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(expense)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id, expense.expenseNumber)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {expensesData && expensesData.pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {expensesData.pagination.page} of {expensesData.pagination.totalPages}
                  {' '}({expensesData.pagination.total} total expenses)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(expensesData.pagination.totalPages, p + 1))}
                    disabled={currentPage === expensesData.pagination.totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <ExpenseFormModal
          expense={editingExpense}
          categories={categoriesData?.data || []}
          currentBalance={currentBalance}
          onClose={() => {
            setIsModalOpen(false);
            setEditingExpense(null);
          }}
          onSubmit={async (data, attachmentFile) => {
            if (editingExpense) {
              updateMutation.mutate(
                { id: editingExpense.id, data },
                {
                  onSuccess: (updatedExpense) => {
                    if (attachmentFile) {
                      uploadAttachmentMutation.mutate({ expenseId: updatedExpense.id, file: attachmentFile });
                    }
                  },
                }
              );
            } else {
              createMutation.mutate(data as CreateExpenseDto, {
                onSuccess: (createdExpense) => {
                  if (attachmentFile) {
                    uploadAttachmentMutation.mutate({ expenseId: createdExpense.id, file: attachmentFile });
                  }
                },
              });
            }
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending || uploadAttachmentMutation.isPending}
        />
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingExpense && (
        <ViewExpenseModal
          expense={viewingExpense}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingExpense(null);
          }}
          onDeleteAttachment={(expenseId) => {
            if (window.confirm('Are you sure you want to delete this attachment?')) {
              deleteAttachmentMutation.mutate(expenseId, {
                onSuccess: (updatedExpense) => {
                  setViewingExpense(updatedExpense);
                },
              });
            }
          }}
          isDeletingAttachment={deleteAttachmentMutation.isPending}
        />
      )}
    </div>
  );
}

// Expense Form Modal Component
interface ExpenseFormModalProps {
  expense: Expense | null;
  categories: any[];
  currentBalance: number;
  onClose: () => void;
  onSubmit: (data: CreateExpenseDto | UpdateExpenseDto, attachmentFile?: File) => void;
  isSubmitting: boolean;
}

function ExpenseFormModal({
  expense,
  categories,
  currentBalance,
  onClose,
  onSubmit,
  isSubmitting,
}: ExpenseFormModalProps) {
  const [formData, setFormData] = useState({
    categoryId: expense?.categoryId || '',
    amount: expense?.amount ? String(expense.amount) : '',
    expenseDate: expense?.expenseDate ? format(new Date(expense.expenseDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    description: expense?.description || '',
    billNumber: expense?.billNumber || '',
    vendorName: expense?.vendorName || '',
    remarks: expense?.remarks || '',
  });
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(expense?.attachmentUrl || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setAttachmentPreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setAttachmentPreview(null);
      }
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(expense?.attachmentUrl || null);
  };

  const getAttachmentUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);

    // Validate balance for new expenses
    if (!expense && amount > currentBalance) {
      alert(`Insufficient balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`);
      return;
    }

    // Validate balance for edited expenses (only if increasing amount)
    if (expense) {
      const oldAmount = Number(expense.amount);
      const amountDifference = amount - oldAmount;
      if (amountDifference > 0 && amountDifference > currentBalance) {
        alert(`Insufficient balance. Available: ₹${currentBalance.toFixed(2)}, Additional required: ₹${amountDifference.toFixed(2)}`);
        return;
      }
    }

    onSubmit({
      categoryId: formData.categoryId,
      amount,
      expenseDate: formData.expenseDate,
      description: formData.description,
      billNumber: formData.billNumber || undefined,
      vendorName: formData.vendorName || undefined,
      remarks: formData.remarks || undefined,
    }, attachmentFile || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">
            {expense ? 'Edit Expense' : 'Record New Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              minLength={5}
              maxLength={1000}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe the expense..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Bill Number and Vendor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number
              </label>
              <input
                type="text"
                value={formData.billNumber}
                onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., INV-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name
              </label>
              <input
                type="text"
                value={formData.vendorName}
                onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., ABC Suppliers"
              />
            </div>
          </div>

          {/* Attachment Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachment (Bill/Receipt)
            </label>
            {!attachmentFile && !attachmentPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Click to upload bill/receipt</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative border border-gray-300 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  {attachmentFile ? (
                    <>
                      {attachmentFile.type.startsWith('image/') ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={attachmentPreview || ''}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachmentFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </>
                  ) : attachmentPreview ? (
                    <>
                      {attachmentPreview.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={getAttachmentUrl(attachmentPreview)}
                            alt="Current attachment"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Current attachment</p>
                        <a
                          href={getAttachmentUrl(attachmentPreview)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-600 hover:text-purple-700"
                        >
                          View attachment
                        </a>
                      </div>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <label className="mt-2 block">
                  <span className="text-xs text-purple-600 cursor-pointer hover:text-purple-700">
                    Change attachment
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : expense ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Expense Modal Component
interface ViewExpenseModalProps {
  expense: Expense;
  onClose: () => void;
  onDeleteAttachment?: (expenseId: string) => void;
  isDeletingAttachment?: boolean;
}

function ViewExpenseModal({ expense, onClose, onDeleteAttachment, isDeletingAttachment }: ViewExpenseModalProps) {
  const getAttachmentUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url}`;
  };

  const isImageAttachment = (url: string) => {
    return url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Expense Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Expense Number</p>
              <p className="font-semibold text-purple-600">{expense.expenseNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="font-semibold">{expense.category?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="text-lg font-bold text-gray-900">
                ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Expense Date</p>
              <p className="font-semibold">{format(new Date(expense.expenseDate), 'dd MMM yyyy')}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Description</p>
            <p className="text-gray-900">{expense.description}</p>
          </div>

          {expense.billNumber && (
            <div>
              <p className="text-sm text-gray-600">Bill Number</p>
              <p className="font-semibold">{expense.billNumber}</p>
            </div>
          )}

          {expense.vendorName && (
            <div>
              <p className="text-sm text-gray-600">Vendor Name</p>
              <p className="font-semibold">{expense.vendorName}</p>
            </div>
          )}

          {expense.attachmentUrl && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Attachment</p>
              <div className="border border-gray-200 rounded-lg p-3">
                {isImageAttachment(expense.attachmentUrl) ? (
                  <div className="relative">
                    <img
                      src={getAttachmentUrl(expense.attachmentUrl)}
                      alt="Expense attachment"
                      className="max-w-full max-h-64 rounded-lg mx-auto"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Document Attachment</p>
                      <p className="text-xs text-gray-500">Click to view</p>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-3">
                  <a
                    href={getAttachmentUrl(expense.attachmentUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Open in new tab
                  </a>
                  {onDeleteAttachment && (
                    <button
                      onClick={() => onDeleteAttachment(expense.id)}
                      disabled={isDeletingAttachment}
                      className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {isDeletingAttachment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {expense.remarks && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Remarks</p>
              <p className="text-gray-900">{expense.remarks}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Recorded By</p>
                <p className="font-medium">
                  {expense.recorder?.firstName} {expense.recorder?.lastName}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Recorded On</p>
                <p className="font-medium">{format(new Date(expense.createdAt), 'dd MMM yyyy, HH:mm')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
