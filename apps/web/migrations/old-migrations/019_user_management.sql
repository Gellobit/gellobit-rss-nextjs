-- User Management: Add status field for suspending users
-- Run this migration in Supabase SQL Editor

-- Add status column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add index for status queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Update existing profiles to have 'active' status
UPDATE profiles SET status = 'active' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.status IS 'User account status: active, suspended';
