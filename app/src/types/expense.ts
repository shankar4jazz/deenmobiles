// Expense Management Types

export enum PettyCashTransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PettyCashRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// ==================== Petty Cash Transfer ====================

export interface PettyCashTransfer {
  id: string;
  transferNumber: string;
  branchId: string;
  employeeId: string | null;
  amount: number;
  transferDate: string;
  paymentMethodId: string | null;
  transactionRef: string | null;
  bankDetails: string | null;
  purpose: string | null;
  remarks: string | null;
  proofUrl: string | null;
  status: PettyCashTransferStatus;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  paymentMethod?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreatePettyCashTransferDto {
  branchId: string;
  employeeId?: string;
  amount: number;
  transferDate?: string;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  purpose?: string;
  remarks?: string;
  proofUrl?: string;
  status?: PettyCashTransferStatus;
}

export interface UpdatePettyCashTransferDto {
  employeeId?: string;
  amount?: number;
  transferDate?: string;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  purpose?: string;
  remarks?: string;
  proofUrl?: string;
  status?: PettyCashTransferStatus;
}

export interface PettyCashTransferFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  status?: PettyCashTransferStatus;
  startDate?: string;
  endDate?: string;
}

export interface BranchBalance {
  totalReceived: number;
  totalExpenses: number;
  currentBalance: number;
}

// ==================== Petty Cash Request ====================

export interface PettyCashRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  requestedAmount: number;
  reason: string;
  requestedBy: string;
  status: PettyCashRequestStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approver?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreatePettyCashRequestDto {
  requestedAmount: number;
  reason: string;
}

export interface UpdatePettyCashRequestDto {
  requestedAmount?: number;
  reason?: string;
}

export interface ApprovePettyCashRequestDto {
  purpose?: string;
  paymentMethodId?: string;
  transactionRef?: string;
  bankDetails?: string;
  remarks?: string;
}

export interface RejectPettyCashRequestDto {
  rejectionReason: string;
}

export interface PettyCashRequestFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  status?: PettyCashRequestStatus;
  startDate?: string;
  endDate?: string;
}

// ==================== Expense ====================

export interface Expense {
  id: string;
  expenseNumber: string;
  branchId: string;
  categoryId: string;
  amount: number;
  expenseDate: string;
  description: string;
  billNumber: string | null;
  vendorName: string | null;
  attachmentUrl: string | null;
  remarks: string | null;
  companyId: string;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
  branch?: {
    id: string;
    name: string;
    code: string;
  };
  category?: {
    id: string;
    name: string;
    code: string;
  };
  recorder?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateExpenseDto {
  categoryId: string;
  amount: number;
  expenseDate?: string;
  description: string;
  billNumber?: string;
  vendorName?: string;
  attachmentUrl?: string;
  remarks?: string;
}

export interface UpdateExpenseDto {
  categoryId?: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  billNumber?: string;
  vendorName?: string;
  attachmentUrl?: string;
  remarks?: string;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  categoryId?: string;
  recordedBy?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseStats {
  totalExpenses: number;
  totalAmount: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    count: number;
  }[];
}

export interface CategoryWiseSpending {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  count: number;
}

export interface BranchExpenseDashboard {
  balance: {
    totalReceived: number;
    totalExpenses: number;
    currentBalance: number;
  };
  monthlyStats: {
    categoryWiseSpending: CategoryWiseSpending[];
    totalMonthlyExpenses: number;
  };
  recentExpenses: Expense[];
}

// ==================== Pagination ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
