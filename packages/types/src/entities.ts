// Core entity types for TrackTime multi-tenant system

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Company/Organization in the multi-tenant system
 */
export interface Company extends BaseEntity {
  name: string;
  slug: string;
  logo?: string;
  settings: CompanySettings;
  subscription?: Subscription;
  isActive: boolean;
}

/**
 * Company-specific settings and policies
 */
export interface CompanySettings {
  // Work policies
  requireGPS: boolean;
  requireFacialRecognition: boolean;
  lateToleranceMinutes: number;
  autoCheckoutAfterHours?: number;
  
  // Overtime settings
  overtimeEnabled: boolean;
  overtimeAfterHours: number;
  overtimeMultiplier: number;
  
  // Work schedule
  defaultWorkSchedule: WorkSchedule;
  timezone: string;
  
  // Notifications
  notifyOnLateCheckIn: boolean;
  notifyOnMissedCheckOut: boolean;
  notifyManagersOnAbsence: boolean;
}

/**
 * User account (can belong to multiple companies with different roles)
 */
export interface User extends BaseEntity {
  email: string;
  phone?: string;
  fullName: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
}

/**
 * Employee - relationship between User and Company
 */
export interface Employee extends BaseEntity {
  userId: string;
  companyId: string;
  employeeNumber?: string;
  role: EmployeeRole;
  department?: string;
  position?: string;
  hireDate: Date;
  workSchedule: WorkSchedule;
  
  // Biometric data
  hasFacialRecognition: boolean;
  facialRecognitionId?: string;
  biometricConsentDate?: Date;
  
  // Status
  isActive: boolean;
  terminationDate?: Date;
}

/**
 * Employee roles within a company
 */
export enum EmployeeRole {
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * Work schedule definition
 */
export interface WorkSchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  totalWeeklyHours: number;
}

export interface DaySchedule {
  startTime: string; // HH:mm format
  endTime: string;
  breakDurationMinutes: number;
  isWorkDay: boolean;
}

/**
 * Time entry - clock in/out record
 */
export interface TimeEntry extends BaseEntity {
  companyId: string;
  employeeId: string;
  
  // Timing
  checkInTime: Date;
  checkOutTime?: Date;
  date: string; // YYYY-MM-DD format
  
  // Location
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
  
  // Verification
  checkInMethod: CheckInMethod;
  checkOutMethod?: CheckInMethod;
  facialVerificationCheckIn?: boolean;
  facialVerificationCheckOut?: boolean;
  
  // Calculated fields
  durationMinutes?: number;
  isLate: boolean;
  isOvertime: boolean;
  overtimeMinutes: number;
  
  // Status
  status: TimeEntryStatus;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  
  // Sync
  syncStatus: SyncStatus;
  syncedAt?: Date;
}

/**
 * Check-in method
 */
export enum CheckInMethod {
  MANUAL = 'manual',
  GPS = 'gps',
  FACIAL = 'facial',
  BIOMETRIC = 'biometric',
  QR_CODE = 'qr_code',
}

/**
 * Time entry status
 */
export enum TimeEntryStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  MODIFIED = 'modified',
}

/**
 * Sync status for offline-first architecture
 */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

/**
 * Geographic location
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
  withinGeofence?: boolean;
  geofenceId?: string;
}

/**
 * Geofence - allowed work locations
 */
export interface Geofence extends BaseEntity {
  companyId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  color?: string;
}

/**
 * Approval request for timesheets
 */
export interface ApprovalRequest extends BaseEntity {
  companyId: string;
  employeeId: string;
  managerId: string;
  
  // Period
  startDate: string;
  endDate: string;
  
  // Time entries
  timeEntryIds: string[];
  
  // Totals
  totalHours: number;
  overtimeHours: number;
  
  // Status
  status: ApprovalStatus;
  reviewedAt?: Date;
  comments?: string;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHANGES_REQUESTED = 'changes_requested',
}

/**
 * Audit log for compliance and security
 */
export interface AuditLog extends BaseEntity {
  companyId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Subscription for multi-tenant billing
 */
export interface Subscription extends BaseEntity {
  companyId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  maxEmployees: number;
  features: string[];
}

export enum SubscriptionPlan {
  FREE = 'free',
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  TRIAL = 'trial',
}

/**
 * Notification
 */
export interface Notification extends BaseEntity {
  companyId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

export enum NotificationType {
  REMINDER = 'reminder',
  APPROVAL = 'approval',
  ALERT = 'alert',
  INFO = 'info',
  WARNING = 'warning',
}

/**
 * Report metadata
 */
export interface Report {
  id: string;
  companyId: string;
  generatedBy: string;
  type: ReportType;
  startDate: string;
  endDate: string;
  filters: ReportFilters;
  data: unknown;
  generatedAt: Date;
  format: ReportFormat;
  fileUrl?: string;
}

export enum ReportType {
  HOURS_WORKED = 'hours_worked',
  OVERTIME = 'overtime',
  ABSENCES = 'absences',
  LATE_ARRIVALS = 'late_arrivals',
  EMPLOYEE_SUMMARY = 'employee_summary',
  COMPANY_DASHBOARD = 'company_dashboard',
}

export enum ReportFormat {
  JSON = 'json',
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export interface ReportFilters {
  employeeIds?: string[];
  departments?: string[];
  includeInactive?: boolean;
  groupBy?: 'employee' | 'department' | 'day' | 'week';
}
