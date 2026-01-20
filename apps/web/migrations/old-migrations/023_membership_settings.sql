-- Migration: Membership monetization settings
-- Version: 023
-- Description: Add membership configuration settings for freemium model

-- ============================================================================
-- STEP 1: Add 'membership' to allowed categories
-- ============================================================================

-- First, drop the existing constraint
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS check_category;

-- Add new constraint with 'membership' included
ALTER TABLE public.system_settings
ADD CONSTRAINT check_category
CHECK (category IN ('general', 'ai', 'prompts', 'scraping', 'advanced', 'personalization', 'analytics', 'membership'));

-- ============================================================================
-- STEP 2: Insert membership settings
-- ============================================================================

INSERT INTO public.system_settings (key, value, description, category) VALUES
    -- Content access settings
    ('membership.free_content_percentage', '60', 'Percentage of opportunities visible to free users (oldest first)', 'membership'),
    ('membership.free_delay_hours', '24', 'Hours delay before free users can see new opportunities', 'membership'),
    ('membership.free_favorites_limit', '5', 'Maximum favorites for free users', 'membership'),

    -- Display settings
    ('membership.show_locked_content', 'true', 'Show locked opportunities with padlock icon (generates FOMO)', 'membership'),
    ('membership.locked_content_blur', 'true', 'Blur title/excerpt of locked opportunities', 'membership'),

    -- Pricing settings
    ('membership.monthly_price', '4.99', 'Monthly subscription price in USD', 'membership'),
    ('membership.annual_price', '39.99', 'Annual subscription price in USD (typically ~30% discount)', 'membership'),

    -- Payment settings
    ('membership.paypal_enabled', 'false', 'Enable PayPal payments', 'membership'),
    ('membership.paypal_client_id', '""', 'PayPal Client ID', 'membership'),
    ('membership.paypal_plan_id_monthly', '""', 'PayPal Plan ID for monthly subscription', 'membership'),
    ('membership.paypal_plan_id_annual', '""', 'PayPal Plan ID for annual subscription', 'membership'),
    ('membership.stripe_enabled', 'false', 'Enable Stripe payments (future)', 'membership'),

    -- Notifications settings for free users
    ('membership.free_notifications_daily', '1', 'Max daily notifications for free users', 'membership'),
    ('membership.free_email_digest', '"weekly"', 'Email digest frequency for free users: daily, weekly, none', 'membership')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.system_settings.category IS 'Setting category: general, ai, prompts, scraping, advanced, personalization, analytics, membership';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
