-- Migration: 024_remove_basic_membership.sql
-- Description: Remove 'basic' from membership_type options
-- Date: 2026-01-16

-- Remove old constraint and add new one without 'basic'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_membership_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_membership_type_check
  CHECK (membership_type IN ('free', 'premium', 'lifetime'));

-- Update any existing 'basic' users to 'free' (if any exist)
UPDATE profiles SET membership_type = 'free' WHERE membership_type = 'basic';

-- Add comment
COMMENT ON COLUMN public.profiles.membership_type IS 'User membership tier: free, premium, lifetime';
