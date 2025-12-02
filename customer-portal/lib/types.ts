export interface StatusHistoryItem {
  status: string;
  statusLabel: string;
  timestamp: string;
  notes: string | null;
}

export interface BranchInfo {
  name: string;
  phone: string;
  address: string;
}

export interface PublicServiceResponse {
  ticketNumber: string;
  deviceModel: string;
  status: string;
  statusLabel: string;
  estimatedCost: number;
  advancePayment: number;
  balanceAmount: number;
  createdAt: string;
  completedAt: string | null;
  deliveredAt: string | null;
  branch: BranchInfo;
  statusHistory: StatusHistoryItem[];
  estimatedCompletionMessage: string;
}

export interface CompanyInfo {
  name: string;
  logo: string | null;
  supportPhone: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
