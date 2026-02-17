// API types for request/response structures

import { TimeEntry, ApprovalRequest, Employee, Company } from './entities';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  statusCode?: number;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  timestamp: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Authentication
 */
export interface LoginRequest {
  email: string;
  password: string;
  companySlug?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  companies: Array<{
    companyId: string;
    companyName: string;
    role: string;
  }>;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  companyName?: string; // For new company creation
  companySlug?: string; // For joining existing company
  inviteCode?: string;
}

/**
 * Time entry requests
 */
export interface CheckInRequest {
  employeeId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  method: string;
  facialImage?: string; // base64 encoded
}

export interface CheckOutRequest {
  timeEntryId: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  method: string;
  facialImage?: string;
  notes?: string;
}

export interface TimeEntryListRequest extends PaginationParams {
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  syncStatus?: string;
}

export interface TimeEntryUpdateRequest {
  checkInTime?: Date;
  checkOutTime?: Date;
  notes?: string;
  reason: string; // Required for audit
}

/**
 * Sync requests for offline support
 */
export interface SyncRequest {
  deviceId: string;
  lastSyncAt?: Date;
  pendingOperations: SyncOperation[];
}

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'timeEntry' | 'employee' | 'company';
  data: unknown;
  timestamp: Date;
  retryCount: number;
}

export interface SyncResponse {
  syncedOperations: string[]; // IDs of successful operations
  failedOperations: Array<{
    id: string;
    error: string;
  }>;
  conflicts: Array<{
    operationId: string;
    serverData: unknown;
    clientData: unknown;
  }>;
  updates: Array<{
    entity: string;
    data: unknown;
  }>;
  lastSyncAt: Date;
}

/**
 * Approval requests
 */
export interface CreateApprovalRequest {
  employeeId: string;
  startDate: string;
  endDate: string;
  timeEntryIds: string[];
  notes?: string;
}

export interface ApprovalActionRequest {
  approvalId: string;
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
}

/**
 * Facial recognition
 */
export interface FacialEnrollmentRequest {
  employeeId: string;
  images: string[]; // base64 encoded images
  consent: boolean;
  consentDate: Date;
}

export interface FacialVerificationRequest {
  employeeId: string;
  image: string; // base64 encoded
}

export interface FacialVerificationResponse {
  verified: boolean;
  confidence: number;
  matchedFaceId?: string;
  requiresFallback: boolean;
}

/**
 * Report requests
 */
export interface GenerateReportRequest {
  type: string;
  startDate: string;
  endDate: string;
  format: string;
  filters?: {
    employeeIds?: string[];
    departments?: string[];
    includeInactive?: boolean;
  };
  groupBy?: string;
}

export interface ReportDownloadRequest {
  reportId: string;
  format: string;
}

/**
 * Dashboard data
 */
export interface DashboardRequest {
  companyId: string;
  employeeId?: string; // For employee-specific dashboard
  period?: 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
}

export interface DashboardResponse {
  summary: {
    totalHours: number;
    overtimeHours: number;
    activeEmployees: number;
    pendingApprovals: number;
    lateArrivals: number;
    absences: number;
  };
  currentlyWorking: Employee[];
  recentActivity: TimeEntry[];
  pendingApprovals: ApprovalRequest[];
  alerts: Array<{
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
    timestamp: Date;
  }>;
}

/**
 * Employee management
 */
export interface CreateEmployeeRequest {
  email: string;
  fullName: string;
  phone?: string;
  employeeNumber?: string;
  role: string;
  department?: string;
  position?: string;
  hireDate: Date;
  workSchedule: unknown;
}

export interface UpdateEmployeeRequest {
  fullName?: string;
  phone?: string;
  role?: string;
  department?: string;
  position?: string;
  workSchedule?: unknown;
  isActive?: boolean;
}

/**
 * Company management
 */
export interface UpdateCompanySettingsRequest {
  settings: Partial<Company['settings']>;
}

export interface CreateGeofenceRequest {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  color?: string;
}
