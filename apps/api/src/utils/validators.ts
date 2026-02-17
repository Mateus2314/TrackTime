import { z } from 'zod';

/**
 * Validation schemas for API requests using Zod
 * Single source of truth for input validation
 */

// =============================================
// AUTHENTICATION VALIDATORS
// =============================================

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  companySlug: z.string().optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  fullName: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome não pode ter mais de 255 caracteres'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  companySlug: z.string().optional(),
  inviteCode: z.string().optional(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Nova senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Nova senha deve conter pelo menos um número'),
});

// =============================================
// TIME ENTRY VALIDATORS
// =============================================

export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  address: z.string().optional(),
}).optional();

export const checkInSchema = z.object({
  location: locationSchema,
  method: z.enum(['manual', 'gps', 'facial', 'biometric', 'qr_code']).default('manual'),
  facialImage: z.string().optional(), // base64
});

export const checkOutSchema = z.object({
  location: locationSchema,
  method: z.enum(['manual', 'gps', 'facial', 'biometric', 'qr_code']).default('manual'),
  facialImage: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const timeEntryListSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'modified']).optional(),
  sortBy: z.enum(['check_in_time', 'date', 'created_at']).optional().default('check_in_time'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const timeEntryUpdateSchema = z.object({
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
  reason: z.string().min(5, 'Motivo deve ter pelo menos 5 caracteres'),
});

// =============================================
// EMPLOYEE VALIDATORS
// =============================================

export const createEmployeeSchema = z.object({
  email: z.string().email('Email inválido'),
  fullName: z.string().min(3).max(255),
  phone: z.string().optional(),
  employeeNumber: z.string().optional(),
  role: z.enum(['employee', 'manager', 'admin', 'owner']).default('employee'),
  department: z.string().optional(),
  position: z.string().optional(),
  hireDate: z.string().date('Data de contratação inválida'),
  workSchedule: z.record(z.any()).optional(),
});

export const updateEmployeeSchema = z.object({
  fullName: z.string().min(3).max(255).optional(),
  phone: z.string().optional(),
  role: z.enum(['employee', 'manager', 'admin', 'owner']).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  workSchedule: z.record(z.any()).optional(),
});

// =============================================
// APPROVAL VALIDATORS
// =============================================

export const createApprovalSchema = z.object({
  employeeId: z.string().uuid('ID de funcionário inválido'),
  startDate: z.string().date(),
  endDate: z.string().date(),
  timeEntryIds: z.array(z.string().uuid()).optional().default([]),
  notes: z.string().optional(),
}).refine(
  (data) => new Date(data.endDate) >= new Date(data.startDate),
  {
    message: 'Data final deve ser após data inicial',
    path: ['endDate'],
  }
);

export const approvalActionSchema = z.object({
  approvalId: z.string().uuid('ID de aprovação inválido'),
  action: z.enum(['approve', 'reject', 'request_changes']),
  comments: z.string().max(500).optional(),
});

// =============================================
// COMPANY/GEOFENCE VALIDATORS
// =============================================

export const createGeofenceSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().positive().min(10).max(50000),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional().default('#4CAF50'),
});

export const updateCompanySettingsSchema = z.object({
  requireGPS: z.boolean().optional(),
  requireFacialRecognition: z.boolean().optional(),
  lateToleranceMinutes: z.number().int().min(0).max(120).optional(),
  overtimeEnabled: z.boolean().optional(),
  overtimeAfterHours: z.number().positive().optional(),
  overtimeMultiplier: z.number().positive().optional(),
  timezone: z.string().optional(),
  notifyOnLateCheckIn: z.boolean().optional(),
  notifyOnMissedCheckOut: z.boolean().optional(),
  notifyManagersOnAbsence: z.boolean().optional(),
});

// =============================================
// SYNC VALIDATORS
// =============================================

export const syncOperationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['create', 'update', 'delete']),
  entity: z.enum(['timeEntry', 'employee', 'company']),
  data: z.record(z.any()),
  timestamp: z.string().datetime(),
  retryCount: z.number().int().min(0).optional().default(0),
});

export const syncRequestSchema = z.object({
  deviceId: z.string().min(1),
  lastSyncAt: z.string().datetime().optional(),
  pendingOperations: z.array(syncOperationSchema),
});

// =============================================
// HELPER: Type inference from schemas
// =============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type TimeEntryListInput = z.infer<typeof timeEntryListSchema>;
export type TimeEntryUpdateInput = z.infer<typeof timeEntryUpdateSchema>;

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;

export type CreateGeofenceInput = z.infer<typeof createGeofenceSchema>;
export type UpdateCompanySettingsInput = z.infer<typeof updateCompanySettingsSchema>;

export type SyncOperationInput = z.infer<typeof syncOperationSchema>;
export type SyncRequestInput = z.infer<typeof syncRequestSchema>;
