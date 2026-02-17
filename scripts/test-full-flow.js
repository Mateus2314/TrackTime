import 'dotenv/config';
import { getSupabaseClient } from '@tracktime/database';

const API_BASE_URL = process.env.API_BASE_URL || process.env.API_URL || 'http://localhost:3001';

const testUser = {
  email: `integration-test-${Date.now()}@tracktime.com`,
  password: 'TestPass123',
  fullName: 'Integration Test User'
};

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

async function testFlow() {
  console.log('=== TESTE DE FLUXO COMPLETO ===\n');
  
  // Test 1: Register
  console.log('1️⃣  TEST: Register');
  const registerRes = await request('POST', '/api/auth/register', testUser);
  console.log(`Status: ${registerRes.status}`);
  console.log(`Response:`, JSON.stringify(registerRes.data, null, 2));
  
  if (registerRes.status !== 201) {
    console.log('❌ Register falhou! Pulando resto dos testes.');
    return;
  }
  
  console.log('✅ Register passou\n');
  
  // Test 2: Login with same credentials
  console.log('2️⃣  TEST: Login');
  const loginRes = await request('POST', '/api/auth/login', {
    email: testUser.email,
    password: testUser.password
  });
  console.log(`Status: ${loginRes.status}`);
  console.log(`Response:`, JSON.stringify(loginRes.data, null, 2));
  
  if (loginRes.status !== 200) {
    console.log('❌ Login falhou!');
    return;
  }
  
  const accessToken = loginRes.data.data.accessToken;
  console.log(`✅ Login passou, accessToken: ${accessToken.substring(0, 20)}...\n`);
  
  // Test 3: Get me with token
  console.log('3️⃣  TEST: Get Me');
  const meRes = await request('GET', '/api/auth/me', null, {
    'Authorization': `Bearer ${accessToken}`
  });
  console.log(`Status: ${meRes.status}`);
  console.log(`Response:`, JSON.stringify(meRes.data, null, 2));
  
  if (meRes.status !== 200) {
    console.log('❌ Get Me falhou!');
    return;
  }
  
  console.log('✅ Get Me passou\n');
  
  // Test 4: Refresh token
  console.log('4️⃣  TEST: Refresh Token');
  const refreshToken = loginRes.data.data.refreshToken;
  const refreshRes = await request('POST', '/api/auth/refresh', {
    refreshToken: refreshToken
  });
  console.log(`Status: ${refreshRes.status}`);
  console.log(`Response:`, JSON.stringify(refreshRes.data, null, 2));
  
  if (refreshRes.status !== 200) {
    console.log('❌ Refresh Token falhou!');
    return;
  }
  
  console.log('✅ Refresh Token passou\n');
  
  // Test 5: Logout
  console.log('5️⃣  TEST: Logout');
  const logoutRes = await request('POST', '/api/auth/logout', null, {
    'Authorization': `Bearer ${loginRes.data.data.accessToken}`
  });
  console.log(`Status: ${logoutRes.status}`);
  console.log(`Response:`, JSON.stringify(logoutRes.data, null, 2));
  
  if (logoutRes.status !== 200) {
    console.log('❌ Logout falhou!');
    return;
  }
  
  console.log('✅ Logout passou\n');
  
  console.log('🎉 TODOS OS TESTES PASSARAM!');
}

testFlow();
