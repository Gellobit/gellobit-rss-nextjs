-- ============================================
-- Push Subscriptions Table for Web Push Notifications
-- ============================================

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Web Push subscription data
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,  -- Public key for encryption
    auth TEXT NOT NULL,     -- Auth secret

    -- Device/browser info
    user_agent TEXT,
    device_name VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique endpoint per user (same device won't be duplicated)
    UNIQUE(user_id, endpoint)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON public.push_subscriptions(endpoint);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add own push subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all (for sending notifications)
CREATE POLICY "Service role can access all push subscriptions" ON public.push_subscriptions
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment
COMMENT ON TABLE public.push_subscriptions IS 'Stores Web Push notification subscriptions for users';
