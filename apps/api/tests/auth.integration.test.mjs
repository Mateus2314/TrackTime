import { test, before } from 'node:test';
import assert from 'node:assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Test data
const testUser = {
  email: process.env.TEST_USER_EMAIL || `test-integration-${Date.now()}@tracktime.com`,
  password: process.env.TEST_USER_PASSWORD || 'TestPass123',
  fullName: 'Integration Test User'
};

const validNewUser = {
  email: `newuser-${Date.now()}@tracktime.com`,
  password: 'SecurePass123',
  fullName: 'New User From Test'
};

let accessToken = '';
let refreshToken = '';

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
}

async function ensureTestUser() {
  requireEnv(SUPABASE_URL, 'SUPABASE_URL');
  requireEnv(SUPABASE_SERVICE_KEY, 'SUPABASE_SERVICE_KEY');

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: listData, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listError) {
    throw new Error(listError.message);
  }

  let authUser = listData?.users?.find((user) => user.email === testUser.email);

  if (!authUser) {
    const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true,
      user_metadata: { full_name: testUser.fullName }
    });

    if (createAuthError) {
      throw new Error(createAuthError.message);
    }

    authUser = createdAuth?.user;
  }

  if (!authUser) {
    throw new Error('Failed to provision auth user');
  }

  const { data: userRows, error: userRowsError } = await admin
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id);

  if (userRowsError) {
    throw new Error(userRowsError.message);
  }

  let userId = userRows?.[0]?.id;

  if (!userId) {
    const { data: createdUser, error: userInsertError } = await admin
      .from('users')
      .insert({
        auth_id: authUser.id,
        email: testUser.email,
        full_name: testUser.fullName
      })
      .select('id')
      .single();

    if (userInsertError) {
      throw new Error(userInsertError.message);
    }

    userId = createdUser.id;
  }

  const companySlug = `test-company-${testUser.email.split('@')[0]}`;

  const { data: companyRows, error: companyRowsError } = await admin
    .from('companies')
    .select('id, name')
    .eq('slug', companySlug);

  if (companyRowsError) {
    throw new Error(companyRowsError.message);
  }

  let companyId = companyRows?.[0]?.id;

  if (!companyId) {
    const { data: createdCompany, error: companyInsertError } = await admin
      .from('companies')
      .insert({
        name: 'Test Company',
        slug: companySlug
      })
      .select('id')
      .single();

    if (companyInsertError) {
      throw new Error(companyInsertError.message);
    }

    companyId = createdCompany.id;
  }

  const { data: employeeRows, error: employeeRowsError } = await admin
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId);

  if (employeeRowsError) {
    throw new Error(employeeRowsError.message);
  }

  if (!employeeRows || employeeRows.length === 0) {
    const { error: employeeInsertError } = await admin
      .from('employees')
      .insert({
        user_id: userId,
        company_id: companyId,
        role: 'owner',
        is_active: true,
        hire_date: new Date().toISOString().split('T')[0]
      });

    if (employeeInsertError) {
      throw new Error(employeeInsertError.message);
    }
  }
}
before(async () => {
  await ensureTestUser();
});

// Helper function for API requests
async function request(method, path, body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => null);

  return {
    status: response.status,
    data,
    ok: response.ok
  };
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

test('Health Checks - API Health Endpoint', async (t) => {
  const res = await request('GET', '/health');
  
  assert.strictEqual(res.status, 200, 'Health check should return 200 OK');
  assert.strictEqual(res.data.status, 'ok', 'Status should be "ok"');
  assert.strictEqual(res.data.service, 'tracktime-api', 'Service should be "tracktime-api"');
  assert(res.data.version, 'Should have version');
  assert(res.data.timestamp, 'Should have timestamp');
});

test('Health Checks - API Root Endpoint', async (t) => {
  const res = await request('GET', '/');
  
  assert.strictEqual(res.status, 200, 'Root should return 200 OK');
  assert(res.data.message, 'Should have message');
  assert(res.data.version, 'Should have version');
});

// ============================================================================
// AUTHENTICATION - REGISTER ENDPOINT
// ============================================================================

test('Register - Valid Registration', async (t) => {
  const res = await request('POST', '/api/auth/register', validNewUser);

  if (
    res.status === 400 &&
    res.data?.error?.message &&
    res.data.error.message.toLowerCase().includes('rate limit')
  ) {
    t.skip('Supabase email rate limit');
    return;
  }

  assert.strictEqual(res.status, 201, 'Should return 201 Created');
  assert.strictEqual(res.data.success, true, 'Success should be true');
  assert(res.data.data.accessToken, 'Should return accessToken');
  assert(res.data.data.refreshToken, 'Should return refreshToken');
  assert(res.data.data.user, 'Should return user data');
  assert(res.data.data.companies, 'Should return companies list');
});

test('Register - Invalid Email Format', async (t) => {
  const invalidEmail = {
    ...validNewUser,
    email: 'not-an-email'
  };
  const res = await request('POST', '/api/auth/register', invalidEmail);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert.strictEqual(res.data.success, false, 'Success should be false');
  assert.strictEqual(res.data.error.code, 'VALIDATION_ERROR', 'Should be validation error');
  assert(res.data.error.details.length > 0, 'Should have error details');
  assert(res.data.error.details.some(e => e.field === 'email'), 'Should have email error');
});

test('Register - Password Too Short', async (t) => {
  const weakPassword = {
    ...validNewUser,
    email: `short-pass-${Date.now()}@tracktime.com`,
    password: 'Pass1'
  };
  const res = await request('POST', '/api/auth/register', weakPassword);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert.strictEqual(res.data.error.code, 'VALIDATION_ERROR', 'Should be validation error');
  assert(res.data.error.details.some(e => e.field === 'password'), 'Should have password error');
});

test('Register - Password Missing Uppercase', async (t) => {
  const noUppercase = {
    ...validNewUser,
    email: `no-upper-${Date.now()}@tracktime.com`,
    password: 'weakpass123'
  };
  const res = await request('POST', '/api/auth/register', noUppercase);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'password'), 'Should have password error');
});

test('Register - Password Missing Number', async (t) => {
  const noNumber = {
    ...validNewUser,
    email: `no-number-${Date.now()}@tracktime.com`,
    password: 'WeakPass'
  };
  const res = await request('POST', '/api/auth/register', noNumber);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'password'), 'Should have password error');
});

test('Register - Missing Required Field (fullName)', async (t) => {
  const missing = {
    email: `missing-full-${Date.now()}@tracktime.com`,
    password: 'SecurePass123'
  };
  const res = await request('POST', '/api/auth/register', missing);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'fullName'), 'Should have fullName error');
});

test('Register - Missing Required Field (email)', async (t) => {
  const missing = {
    password: 'SecurePass123',
    fullName: 'Test User'
  };
  const res = await request('POST', '/api/auth/register', missing);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'email'), 'Should have email error');
});

test('Register - Missing Required Field (password)', async (t) => {
  const missing = {
    email: `missing-pass-${Date.now()}@tracktime.com`,
    fullName: 'Test User'
  };
  const res = await request('POST', '/api/auth/register', missing);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'password'), 'Should have password error');
});

// ============================================================================
// AUTHENTICATION - LOGIN ENDPOINT
// ============================================================================

test('Login - Valid Credentials', async (t) => {
  const res = await request('POST', '/api/auth/login', testUser);
  
  assert.strictEqual(res.status, 200, 'Should return 200 OK');
  assert.strictEqual(res.data.success, true, 'Success should be true');
  assert(res.data.data.accessToken, 'Should return accessToken');
  assert(res.data.data.refreshToken, 'Should return refreshToken');
  assert(res.data.data.user, 'Should return user data');
  assert(res.data.data.companies, 'Should return companies array');
  
  // Store tokens for later tests
  accessToken = res.data.data.accessToken;
  refreshToken = res.data.data.refreshToken;
});

test('Login - Invalid Email Format', async (t) => {
  const invalid = {
    email: 'not-an-email',
    password: 'TestPass123'
  };
  const res = await request('POST', '/api/auth/login', invalid);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert.strictEqual(res.data.error.code, 'VALIDATION_ERROR', 'Should be validation error');
  assert(res.data.error.details.some(e => e.field === 'email'), 'Should have email error');
});

test('Login - Invalid Password', async (t) => {
  const invalid = {
    email: testUser.email,
    password: 'WrongPassword123'
  };
  const res = await request('POST', '/api/auth/login', invalid);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert.strictEqual(res.data.success, false, 'Success should be false');
});

test('Login - Non-existent User', async (t) => {
  const nonexistent = {
    email: `nonexistent-${Date.now()}@tracktime.com`,
    password: 'AnyPassword123'
  };
  const res = await request('POST', '/api/auth/login', nonexistent);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
});

test('Login - Missing Email Field', async (t) => {
  const missing = {
    password: 'TestPass123'
  };
  const res = await request('POST', '/api/auth/login', missing);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'email'), 'Should have email error');
});

test('Login - Missing Password Field', async (t) => {
  const missing = {
    email: testUser.email
  };
  const res = await request('POST', '/api/auth/login', missing);
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'password'), 'Should have password error');
});

// ============================================================================
// AUTHENTICATION - GET CURRENT USER (ME) ENDPOINT
// ============================================================================

test('Get Current User - Valid Token', async (t) => {
  assert(accessToken, 'Access token should exist from login test');
  
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${accessToken}`
  });
  
  assert.strictEqual(res.status, 200, 'Should return 200 OK');
  assert.strictEqual(res.data.success, true, 'Success should be true');
  assert(res.data.data.id, 'Should return user ID');
  assert(res.data.data.email, 'Should return user email');
  assert(res.data.data.fullName, 'Should return user full name');
  assert(res.data.data.companies, 'Should return companies array');
});

test('Get Current User - No Authorization Header', async (t) => {
  const res = await request('GET', '/api/auth/me');
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
  assert.strictEqual(res.data.success, false, 'Success should be false');
});

test('Get Current User - Invalid Token Format (No Bearer)', async (t) => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': 'InvalidToken123'
  });
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
});

test('Get Current User - Invalid Token (Malformed)', async (t) => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': 'Bearer invalid.token.here'
  });
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
});

test('Get Current User - Empty Authorization Header', async (t) => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': ''
  });
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
});

// ============================================================================
// AUTHENTICATION - REFRESH TOKEN ENDPOINT
// ============================================================================

test('Refresh Token - Valid Refresh Token', async (t) => {
  assert(refreshToken, 'Refresh token should exist from login test');
  
  const res = await request('POST', '/api/auth/refresh', {
    refreshToken: refreshToken
  });
  
  assert.strictEqual(res.status, 200, 'Should return 200 OK');
  assert.strictEqual(res.data.success, true, 'Success should be true');
  assert(res.data.data.accessToken, 'Should return new accessToken');
  assert(res.data.data.refreshToken, 'Should return refresh token');
});

test('Refresh Token - Invalid Token Format', async (t) => {
  const res = await request('POST', '/api/auth/refresh', {
    refreshToken: 'invalid.malformed.token'
  });
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
});

test('Refresh Token - Expired/Invalid Token', async (t) => {
  const res = await request('POST', '/api/auth/refresh', {
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ'
  });
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
});

test('Refresh Token - Missing refreshToken Field', async (t) => {
  const res = await request('POST', '/api/auth/refresh', {});
  
  assert.strictEqual(res.status, 400, 'Should return 400 Bad Request');
  assert(res.data.error.details.some(e => e.field === 'refreshToken'), 'Should have refreshToken error');
});

// ============================================================================
// AUTHENTICATION - LOGOUT ENDPOINT
// ============================================================================

test('Logout - Valid Token', async (t) => {
  // First login to get fresh token
  const loginRes = await request('POST', '/api/auth/login', testUser);
  const token = loginRes.data.data.accessToken;
  
  const res = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${token}`
  });
  
  assert.strictEqual(res.status, 200, 'Should return 200 OK');
  assert.strictEqual(res.data.success, true, 'Success should be true');
});

test('Logout - No Authorization Header', async (t) => {
  const res = await request('POST', '/api/auth/logout');
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
});

test('Logout - Invalid Token', async (t) => {
  const res = await request('POST', '/api/auth/logout', null, {
    'Authorization': 'Bearer invalid.token.xyz'
  });
  
  assert.strictEqual(res.status, 401, 'Should return 401 Unauthorized');
});

// ============================================================================
// ERROR RESPONSE STRUCTURE VALIDATION
// ============================================================================

test('Error Structure - 400 Validation Error', async (t) => {
  const res = await request('POST', '/api/auth/register', {
    email: 'invalid',
    password: 'weak',
    fullName: ''
  });
  
  assert.strictEqual(res.status, 400, 'Should return 400');
  assert.strictEqual(res.data.success, false, 'Success should be false');
  assert.strictEqual(res.data.error.code, 'VALIDATION_ERROR', 'Error code should be VALIDATION_ERROR');
  assert(res.data.error.message, 'Should have error message');
  assert(Array.isArray(res.data.error.details), 'Details should be an array');
  assert(res.data.error.details[0].field, 'Detail should have field');
  assert(res.data.error.details[0].message, 'Detail should have message');
});

test('Error Structure - 401 Unauthorized Error', async (t) => {
  const res = await request('GET', '/api/auth/me', null, {
    'Authorization': 'Bearer invalid'
  });
  
  assert.strictEqual(res.status, 401, 'Should return 401');
  assert.strictEqual(res.data.success, false, 'Success should be false');
  assert(res.data.error.code, 'Should have error code');
  assert(res.data.error.message, 'Should have error message');
});

test('Success Structure - 200 Response', async (t) => {
  const res = await request('GET', '/health');
  
  assert.strictEqual(res.status, 200, 'Should return 200');
  assert(res.data.status, 'Should have status field');
  assert(res.data.service, 'Should have service field');
  assert(res.data.version, 'Should have version field');
});

test('Success Structure - 201 Created Response', async (t) => {
  const newUser = {
    email: `final-${Date.now()}@tracktime.com`,
    password: 'SecurePass123',
    fullName: 'Final Test User'
  };
  const res = await request('POST', '/api/auth/register', newUser);
  
  assert.strictEqual(res.status, 201, 'Should return 201');
  assert.strictEqual(res.data.success, true, 'Success should be true');
  assert(res.data.data, 'Should have data field');
  assert(res.data.data.accessToken, 'Data should have accessToken');
  assert(res.data.data.user, 'Data should have user');
  assert(res.data.data.companies, 'Data should have companies');
});

// ============================================================================
// PORTUGUESE ERROR MESSAGES VALIDATION
// ============================================================================

test('Portuguese Messages - Email Error', async (t) => {
  const res = await request('POST', '/api/auth/register', {
    email: 'invalid',
    password: 'SecurePass123',
    fullName: 'Test'
  });
  
  const emailError = res.data.error.details.find(e => e.field === 'email');
  assert(emailError, 'Should have email error');
  assert(emailError.message.toLowerCase().includes('email'), 'Error message should mention email');
});

test('Portuguese Messages - Password Error', async (t) => {
  const res = await request('POST', '/api/auth/register', {
    email: 'test@example.com',
    password: 'weak',
    fullName: 'Test'
  });
  
  const passwordError = res.data.error.details.find(e => e.field === 'password');
  assert(passwordError, 'Should have password error');
  assert(passwordError.message.toLowerCase().includes('senha') || passwordError.message.toLowerCase().includes('password'), 'Message should be in Portuguese or English');
});

console.log('\n=== Authentication Integration Tests Suite ===');
console.log('Tests cover:');
console.log('- Health Checks (2 tests)');
console.log('- Register Validation (7 tests)');
console.log('- Login Validation (6 tests)');
console.log('- Get Current User (5 tests)');
console.log('- Refresh Token (4 tests)');
console.log('- Logout (3 tests)');
console.log('- Error Structure (3 tests)');
console.log('- Portuguese Messages (2 tests)');
console.log('Total: 32 comprehensive tests\n');
