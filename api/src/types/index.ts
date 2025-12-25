import { Request } from 'express';
import { UserRole as PrismaUserRole } from '@prisma/client';

export type UserRole = PrismaUserRole;

export enum ServiceStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_PARTS = 'WAITING_PARTS',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  UPI = 'UPI',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface AuthUser {
  userId: string;
  email: string | null;
  role: UserRole;
  roleId?: string;
  companyId: string;
  branchId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export interface JWTPayload {
  userId: string;
  email: string | null;
  role: UserRole;
  roleId?: string;
  companyId: string;
  branchId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
