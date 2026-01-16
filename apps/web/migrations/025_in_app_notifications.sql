-- =====================================================
-- Migration 025: In-App Notifications System
-- =====================================================
-- Creates the infrastructure for in-app notifications
-- =====================================================

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Notification content
    type TEXT NOT NULL, -- 'new_opportunity', 'favorite_expiring', 'system', 'membership'
    title TEXT NOT NULL,
    message TEXT,

    -- Related entity (optional)
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,

    -- Metadata for additional context
    metadata JSONB DEFAULT '{}',

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Expiration (optional - notifications can auto-expire)
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at) WHERE expires_at IS NOT NULL;

-- 3. Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can insert notifications (for system/triggers)
CREATE POLICY "Service role can insert notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (true);

-- 5. Create function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = p_user_id
        AND is_read = false
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$;

-- 6. Create function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id
    AND is_read = false;

    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count;
END;
$$;

-- 7. Create function to clean up expired notifications (to be called by cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 8. Create function to send notification (helper for triggers)
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_opportunity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, opportunity_id, metadata, expires_at)
    VALUES (p_user_id, p_type, p_title, p_message, p_opportunity_id, p_metadata, p_expires_at)
    RETURNING id INTO new_id;

    RETURN new_id;
END;
$$;

-- 9. Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_notifications TO service_role;

-- 10. Add comment for documentation
COMMENT ON TABLE public.notifications IS 'Stores in-app notifications for users';
COMMENT ON COLUMN public.notifications.type IS 'Type of notification: new_opportunity, favorite_expiring, system, membership';
COMMENT ON COLUMN public.notifications.metadata IS 'Additional JSON data like opportunity_type, prize_value, etc.';
