import { test } from 'node:test';
import assert from 'node:assert/strict';
import dotenv from 'dotenv';

// Load env from repo root
dotenv.config({ path: '../../.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

function requireEnv(value, name) {
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
}

test('Supabase auth health responds', async () => {
  requireEnv(supabaseUrl, 'SUPABASE_URL');
  requireEnv(supabaseAnonKey, 'SUPABASE_ANON_KEY');

  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  assert.equal(response.ok, true);
  const data = await response.json();
  assert.ok(data.version);
});

test('TrackTime API health responds', async () => {
  const response = await fetch(`${apiBaseUrl}/health`);
  assert.equal(response.ok, true);
  const data = await response.json();
  assert.equal(data.status, 'ok');
});
