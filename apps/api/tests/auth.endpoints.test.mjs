import { test } from 'node:test';
import assert from 'node:assert';
import app from '../src/index.js';

const API_URL = 'http://localhost:3001';
const TEST_USER = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  fullName: 'Test User',
};

let accessToken: string;
let refreshToken: string;

/**
 * Test Suite: Authentication Endpoints
 * Tests user registration, login, refresh, and profile retrieval
 */

test('Auth Endpoints - POST /api/auth/register', async (t) => {
  await t.test('should register a new user successfully', async () => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        fullName: TEST_USER.fullName,
        companyName: 'Test Company',
      }),
    });

    assert.strictEqual(response.status, 201, 'Should return 201 Created');

    const data = await response.json();
    assert.strictEqual(data.success, true, 'Should return success: true');
    assert.ok(data.data.user, 'Should return user object');
    assert.strictEqual(
      data.data.user.email,
      TEST_USER.email,
      'Email should match'
    );
    assert.ok(data.data.accessToken, 'Should return accessToken');
    assert.ok(data.data.refreshToken, 'Should return refreshToken');
    assert.ok(data.data.companies.length > 0, 'Should have at least one company');

    // Save tokens for subsequent tests
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  await t.test('should reject registration with invalid email', async () => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'invalid-email',
        password: TEST_USER.password,
        fullName: TEST_USER.fullName,
      }),
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');

    const data = await response.json();
    assert.strictEqual(data.success, false, 'Should return success: false');
  });

  await t.test('should reject registration with weak password', async () => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-weak-${Date.now()}@example.com`,
        password: 'weak',
        fullName: TEST_USER.fullName,
      }),
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');

    const data = await response.json();
    assert.strictEqual(
      data.error.code,
      'VALIDATION_ERROR',
      'Should return validation error'
    );
  });
});

test('Auth Endpoints - POST /api/auth/login', async (t) => {
  await t.test('should login successfully with correct credentials', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    assert.strictEqual(response.status, 200, 'Should return 200 OK');

    const data = await response.json();
    assert.strictEqual(data.success, true, 'Should return success: true');
    assert.ok(data.data.user, 'Should return user object');
    assert.ok(data.data.accessToken, 'Should return accessToken');
    assert.ok(data.data.refreshToken, 'Should return refreshToken');
  });

  await t.test('should reject login with incorrect password', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: 'WrongPassword123!',
      }),
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');

    const data = await response.json();
    assert.strictEqual(data.success, false, 'Should return success: false');
  });

  await t.test('should reject login with non-existent email', async () => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: TEST_USER.password,
      }),
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');
  });
});

test('Auth Endpoints - POST /api/auth/refresh', async (t) => {
  await t.test('should refresh token successfully', async () => {
    if (!refreshToken) {
      throw new Error('Refresh token not available - ensure register test ran first');
    }

    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken,
      }),
    });

    assert.strictEqual(response.status, 200, 'Should return 200 OK');

    const data = await response.json();
    assert.strictEqual(data.success, true, 'Should return success: true');
    assert.ok(data.data.accessToken, 'Should return new accessToken');
    assert.ok(data.data.refreshToken, 'Should return refreshToken');

    // Update tokens
    accessToken = data.data.accessToken;
    refreshToken = data.data.refreshToken;
  });

  await t.test('should reject refresh with invalid token', async () => {
    const response = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: 'invalid-token',
      }),
    });

    assert.strictEqual(response.status, 400, 'Should return 400 Bad Request');

    const data = await response.json();
    assert.strictEqual(data.success, false, 'Should return success: false');
  });
});

test('Auth Endpoints - GET /api/auth/me', async (t) => {
  await t.test('should get current user data with valid token', async () => {
    if (!accessToken) {
      throw new Error('Access token not available - ensure register test ran first');
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    assert.strictEqual(response.status, 200, 'Should return 200 OK');

    const data = await response.json();
    assert.strictEqual(data.success, true, 'Should return success: true');
    assert.ok(data.data.id, 'Should return user id');
    assert.strictEqual(data.data.email, TEST_USER.email, 'Email should match');
    assert.ok(Array.isArray(data.data.companies), 'Should return companies array');
  });

  await t.test('should reject request without token', async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {},
    });

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');

    const data = await response.json();
    assert.strictEqual(
      data.error.code,
      'UNAUTHORIZED',
      'Should return UNAUTHORIZED error'
    );
  });

  await t.test('should reject request with invalid token', async () => {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
    });

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');

    const data = await response.json();
    assert.strictEqual(
      data.error.code,
      'INVALID_TOKEN',
      'Should return INVALID_TOKEN error'
    );
  });
});

test('Auth Endpoints - POST /api/auth/logout', async (t) => {
  await t.test('should logout successfully', async () => {
    if (!accessToken) {
      throw new Error('Access token not available');
    }

    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    assert.strictEqual(response.status, 200, 'Should return 200 OK');

    const data = await response.json();
    assert.strictEqual(data.success, true, 'Should return success: true');
  });

  await t.test('should reject logout without token', async () => {
    const response = await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {},
    });

    assert.strictEqual(response.status, 401, 'Should return 401 Unauthorized');
  });
});

console.log('\n📧 Running Authentication Endpoint Tests...\n');
