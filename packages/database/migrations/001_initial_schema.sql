-- ==============================================
-- 001_initial_schema.sql
-- TrackTime multi-tenant initial schema
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. COMPANIES (Multi-tenant base)
-- =============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  logo TEXT,
  settings JSONB DEFAULT '{
    "requireGPS": false,
    "requireFacialRecognition": false,
    "lateToleranceMinutes": 15,
    "overtimeEnabled": true,
    "overtimeAfterHours": 8,
    "overtimeMultiplier": 1.5,
    "timezone": "America/Sao_Paulo",
    "notifyOnLateCheckIn": true,
    "notifyOnMissedCheckOut": true,
    "notifyManagersOnAbsence": true
  }'::JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT companies_name_not_empty CHECK (name != ''),
  CONSTRAINT companies_slug_not_empty CHECK (slug != '')
);

CREATE INDEX idx_companies_slug ON companies(slug);
CREATE INDEX idx_companies_is_active ON companies(is_active);

-- =============================================
-- 2. USERS (Auth users from Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID NOT NULL, -- FK to Supabase auth.users
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT users_email_not_empty CHECK (email != ''),
  CONSTRAINT users_full_name_not_empty CHECK (full_name != '')
);

CREATE UNIQUE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- =============================================
-- 3. EMPLOYEES (User-Company relationship)
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_number VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'employee', -- employee, manager, admin, owner
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE NOT NULL,
  work_schedule JSONB DEFAULT '{}' NOT NULL,
  has_facial_recognition BOOLEAN DEFAULT false,
  facial_recognition_id VARCHAR(255),
  biometric_consent_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  termination_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, company_id),
  CONSTRAINT employees_role_valid CHECK (role IN ('employee', 'manager', 'admin', 'owner')),
  CONSTRAINT employees_hire_date_valid CHECK (hire_date <= CURRENT_DATE)
);

CREATE INDEX idx_employees_company_id ON employees(company_id);
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_employees_company_user ON employees(company_id, user_id);

-- =============================================
-- 4. WORK SCHEDULES (Reference table)
-- =============================================
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  schedule JSONB NOT NULL DEFAULT '{}'::JSONB, -- monday-sunday with start/end times
  total_weekly_hours NUMERIC(5,2) NOT NULL DEFAULT 40.00,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT work_schedules_name_not_empty CHECK (name != ''),
  CONSTRAINT work_schedules_hours_positive CHECK (total_weekly_hours > 0)
);

CREATE INDEX idx_work_schedules_company_id ON work_schedules(company_id);
CREATE INDEX idx_work_schedules_is_default ON work_schedules(is_default);
CREATE INDEX idx_work_schedules_is_active ON work_schedules(is_active);

-- =============================================
-- 5. GEOFENCES (Allowed work locations)
-- =============================================
CREATE TABLE IF NOT EXISTS geofences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  radius_meters NUMERIC(10, 2) NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  color VARCHAR(7) DEFAULT '#4CAF50',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT geofences_name_not_empty CHECK (name != ''),
  CONSTRAINT geofences_radius_positive CHECK (radius_meters > 0),
  CONSTRAINT geofences_latitude_valid CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT geofences_longitude_valid CHECK (longitude >= -180 AND longitude <= 180)
);

CREATE INDEX idx_geofences_company_id ON geofences(company_id);
CREATE INDEX idx_geofences_is_active ON geofences(is_active);

-- =============================================
-- 6. TIME ENTRIES (Core - Registros de ponto)
-- =============================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in_location JSONB, -- {latitude, longitude, accuracy, address}
  check_out_location JSONB,
  check_in_method VARCHAR(50) DEFAULT 'manual', -- manual, gps, facial, biometric, qr_code
  check_out_method VARCHAR(50),
  facial_verification_check_in BOOLEAN DEFAULT false,
  facial_verification_check_out BOOLEAN DEFAULT false,
  duration_minutes INTEGER,
  is_late BOOLEAN DEFAULT false,
  is_overtime BOOLEAN DEFAULT false,
  overtime_minutes INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, modified
  approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  sync_status VARCHAR(50) DEFAULT 'synced', -- synced, pending, failed, conflict
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT time_entries_check_out_after_in CHECK (check_out_time IS NULL OR check_out_time > check_in_time),
  CONSTRAINT time_entries_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  CONSTRAINT time_entries_sync_status_valid CHECK (sync_status IN ('synced', 'pending', 'failed', 'conflict')),
  CONSTRAINT time_entries_check_in_method_valid CHECK (check_in_method IN ('manual', 'gps', 'facial', 'biometric', 'qr_code')),
  CONSTRAINT time_entries_overtime_nonnegative CHECK (overtime_minutes >= 0)
);

CREATE INDEX idx_time_entries_company_id ON time_entries(company_id);
CREATE INDEX idx_time_entries_employee_id ON time_entries(employee_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_status ON time_entries(status);
CREATE INDEX idx_time_entries_sync_status ON time_entries(sync_status);
CREATE INDEX idx_time_entries_company_employee_date ON time_entries(company_id, employee_id, date);
CREATE INDEX idx_time_entries_created_at ON time_entries(created_at);

-- =============================================
-- 7. APPROVALS (Timesheet approvals)
-- =============================================
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  time_entry_ids UUID[] DEFAULT '{}',
  total_hours NUMERIC(8, 2) NOT NULL DEFAULT 0,
  overtime_hours NUMERIC(8, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, changes_requested
  reviewed_at TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT approvals_end_after_start CHECK (end_date >= start_date),
  CONSTRAINT approvals_status_valid CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
  CONSTRAINT approvals_hours_nonnegative CHECK (total_hours >= 0),
  CONSTRAINT approvals_overtime_nonnegative CHECK (overtime_hours >= 0)
);

CREATE INDEX idx_approvals_company_id ON approvals(company_id);
CREATE INDEX idx_approvals_employee_id ON approvals(employee_id);
CREATE INDEX idx_approvals_manager_id ON approvals(manager_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_created_at ON approvals(created_at);

-- =============================================
-- 8. AUDIT LOGS (Compliance & security)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  changes JSONB, -- before/after changes
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT audit_logs_action_not_empty CHECK (action != ''),
  CONSTRAINT audit_logs_entity_type_not_empty CHECK (entity_type != '')
);

CREATE INDEX idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- =============================================
-- ROW LEVEL SECURITY (Multi-tenancy)
-- =============================================

-- Enable RLS for all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current company_id from JWT
CREATE OR REPLACE FUNCTION get_current_company_id() RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'company_id')::UUID;
$$ LANGUAGE SQL STABLE;

-- helper function to get current user_id
CREATE OR REPLACE FUNCTION get_current_user_id() RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL STABLE;

-- RLS Policies - COMPANIES (only own company)
CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- RLS Policies - EMPLOYEES (company isolation)
CREATE POLICY "Users can view employees of their company"
  ON employees FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

CREATE POLICY "Managers/Admins can update employees in their company"
  ON employees FOR UPDATE
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id() 
        AND role IN ('manager', 'admin', 'owner')
    )
  );

-- RLS Policies - TIME_ENTRIES (company isolation)
CREATE POLICY "Users can view time entries from their company"
  ON time_entries FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

CREATE POLICY "Employees can insert own time entries"
  ON time_entries FOR INSERT
  WITH CHECK (
    employee_id IN (
      SELECT id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

CREATE POLICY "Employees can update own time entries"
  ON time_entries FOR UPDATE
  USING (
    employee_id IN (
      SELECT id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- RLS Policies - APPROVALS
CREATE POLICY "Users can view approvals from their company"
  ON approvals FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- RLS Policies - AUDIT_LOGS
CREATE POLICY "Users can view audit logs from their company"
  ON audit_logs FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- RLS Policies - GEOFENCES
CREATE POLICY "Users can view geofences from their company"
  ON geofences FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- RLS Policies - WORK_SCHEDULES
CREATE POLICY "Users can view work schedules from their company"
  ON work_schedules FOR SELECT
  USING (
    company_id IN (
      SELECT DISTINCT company_id 
      FROM employees 
      WHERE user_id = get_current_user_id()
    )
  );

-- =============================================
-- SEED DATA (Desenvolvimento)
-- =============================================

-- Create initial company
INSERT INTO companies (name, slug, is_active) 
VALUES ('TrackTime Dev', 'tracktime-dev', true)
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- Comments and documentation
-- =============================================

COMMENT ON TABLE companies IS 'Organizations using TrackTime - multi-tenant base';
COMMENT ON TABLE employees IS 'User-Company relationships with roles';
COMMENT ON TABLE time_entries IS 'Core time tracking records with GPS, facial verification, and approval workflow';
COMMENT ON TABLE approvals IS 'Timesheet approval workflow';
COMMENT ON TABLE audit_logs IS 'Compliance and security audit trail';
COMMENT ON COLUMN time_entries.sync_status IS 'For offline-first mobile app synchronization';
COMMENT ON COLUMN time_entries.facial_verification_check_in IS 'Whether facial recognition was used for verification';
COMMENT ON COLUMN employees.has_facial_recognition IS 'Whether employee has enrolled in facial recognition';

-- =============================================
-- Log migration execution
-- =============================================
DO $$
BEGIN
  RAISE NOTICE 'TrackTime initial schema created successfully at %', NOW();
END $$;
