-- Migration: 038_membership_system_toggle.sql
-- Add setting to enable/disable entire membership system

INSERT INTO public.system_settings (key, value, description, category)
VALUES (
  'membership.system_enabled',
  'true',
  'Master toggle for membership system. When false, all users have full content access but ads remain active for monetization.',
  'membership'
) ON CONFLICT (key) DO NOTHING;
