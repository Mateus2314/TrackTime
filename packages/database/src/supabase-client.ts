import dotenv from 'dotenv';
import path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Load environment variables from workspace root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Singleton Supabase client for the TrackTime application
 * Handles authentication and database operations
 */

let supabaseInstance: SupabaseClient | null = null;

function initializeSupabase(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing required env vars: SUPABASE_URL and SUPABASE_SERVICE_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = initializeSupabase();
  }
  return supabaseInstance;
}

/**
 * Initialize Supabase client
 * Call this once at application startup
 */
export function initSupabase(): SupabaseClient {
  return getSupabaseClient();
}

/**
 * Helper to get Supabase Admin client
 * (service role key with bypass RLS)
 */
export function getSupabaseAdmin() {
  return getSupabaseClient();
}

export default getSupabaseClient;
