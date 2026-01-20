-- Migration: User features - profiles enhancement, favorites, notifications
-- Version: 013

-- ============================================================================
-- STEP 1: Enhance profiles table with user features
-- ============================================================================

-- Add new columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT 'free' CHECK (membership_type IN ('free', 'basic', 'premium', 'lifetime')),
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);

-- Index for membership lookups
CREATE INDEX IF NOT EXISTS idx_profiles_membership ON public.profiles(membership_type);

-- ============================================================================
-- STEP 2: Create user_favorites table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure user can only favorite an opportunity once
    UNIQUE(user_id, opportunity_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_opportunity ON public.user_favorites(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON public.user_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own favorites
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Admins can view all favorites (for analytics)
CREATE POLICY "Admins can view all favorites" ON public.user_favorites
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- STEP 3: Create user_notification_settings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

    -- Email notifications
    email_new_opportunities BOOLEAN DEFAULT true,
    email_favorites_expiring BOOLEAN DEFAULT true,
    email_weekly_digest BOOLEAN DEFAULT true,
    email_membership_updates BOOLEAN DEFAULT true,

    -- Push notifications (for future mobile app)
    push_enabled BOOLEAN DEFAULT false,
    push_new_opportunities BOOLEAN DEFAULT true,
    push_favorites_expiring BOOLEAN DEFAULT true,

    -- In-app notifications
    app_new_opportunities BOOLEAN DEFAULT true,
    app_favorites_expiring BOOLEAN DEFAULT true,

    -- Notification preferences
    opportunity_types TEXT[] DEFAULT ARRAY[]::TEXT[], -- Empty = all types
    min_prize_value INTEGER, -- Minimum prize value to notify (null = no minimum)

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON public.user_notification_settings(user_id);

-- Enable RLS
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own notification settings
CREATE POLICY "Users can view own notification settings" ON public.user_notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings" ON public.user_notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings" ON public.user_notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- STEP 4: Create user_read_history table (for "read later" tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_read_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE,
    saved_for_later BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, opportunity_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_read_history_user ON public.user_read_history(user_id);
CREATE INDEX IF NOT EXISTS idx_read_history_saved ON public.user_read_history(user_id, saved_for_later) WHERE saved_for_later = true;

-- Enable RLS
ALTER TABLE public.user_read_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own read history" ON public.user_read_history
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 5: Triggers
-- ============================================================================

-- Update notification settings updated_at
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON public.user_notification_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Function to create default notification settings on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION create_default_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_notification_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification settings when profile is created
CREATE TRIGGER create_notification_settings_on_profile
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_settings();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.user_favorites IS 'User saved/favorite opportunities';
COMMENT ON TABLE public.user_notification_settings IS 'User notification preferences';
COMMENT ON TABLE public.user_read_history IS 'Tracks which opportunities users have read or saved for later';

COMMENT ON COLUMN public.profiles.membership_type IS 'User membership tier: free, basic, premium, lifetime';
COMMENT ON COLUMN public.profiles.membership_expires_at IS 'When the paid membership expires (null for lifetime or free)';
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for payment processing';
COMMENT ON COLUMN public.profiles.paypal_subscription_id IS 'PayPal subscription ID for payment processing';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
