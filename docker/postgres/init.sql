-- Initialization script for TrackTime database
-- This runs on first container startup

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial schema
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'TrackTime database initialized successfully';
END $$;
