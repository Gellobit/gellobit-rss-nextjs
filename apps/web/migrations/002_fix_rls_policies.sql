-- ============================================
-- Fix RLS Policies - Remove Infinite Recursion
-- ============================================

-- 1. DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- RSS Feeds policies
DROP POLICY IF EXISTS "Admins can view all feeds" ON rss_feeds;
DROP POLICY IF EXISTS "Admins can insert feeds" ON rss_feeds;
DROP POLICY IF EXISTS "Admins can update feeds" ON rss_feeds;
DROP POLICY IF EXISTS "Admins can delete feeds" ON rss_feeds;

-- Opportunities policies
DROP POLICY IF EXISTS "Published opportunities are viewable by everyone" ON opportunities;
DROP POLICY IF EXISTS "Admins can view all opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can insert opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can update opportunities" ON opportunities;
DROP POLICY IF EXISTS "Admins can delete opportunities" ON opportunities;

-- AI Settings policies
DROP POLICY IF EXISTS "Admins can view AI settings" ON ai_settings;
DROP POLICY IF EXISTS "Admins can manage AI settings" ON ai_settings;

-- Processing Logs policies
DROP POLICY IF EXISTS "Admins can view processing logs" ON processing_logs;
DROP POLICY IF EXISTS "System can insert logs" ON processing_logs;

-- Duplicate Tracking policies
DROP POLICY IF EXISTS "System can manage duplicate tracking" ON duplicate_tracking;

-- AI Queue policies
DROP POLICY IF EXISTS "System can manage AI queue" ON ai_queue;

-- Analytics policies
DROP POLICY IF EXISTS "Admins can view analytics" ON analytics;
DROP POLICY IF EXISTS "System can insert analytics" ON analytics;

-- Processing History policies
DROP POLICY IF EXISTS "Admins can view processing history" ON processing_history;
DROP POLICY IF EXISTS "System can insert processing history" ON processing_history;

-- Prompt Templates policies
DROP POLICY IF EXISTS "Admins can view prompt templates" ON prompt_templates;
DROP POLICY IF EXISTS "Admins can manage prompt templates" ON prompt_templates;


-- 2. CREATE NEW SIMPLIFIED POLICIES
-- ============================================

-- PROFILES TABLE - Simple policies without recursion
-- ============================================
CREATE POLICY "Enable read access for authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Enable insert on signup"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);


-- RSS_FEEDS TABLE - Admin only access
-- ============================================
CREATE POLICY "Admins can view all feeds"
ON rss_feeds FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert feeds"
ON rss_feeds FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update feeds"
ON rss_feeds FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete feeds"
ON rss_feeds FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- OPPORTUNITIES TABLE - Public read, admin write
-- ============================================
CREATE POLICY "Published opportunities are viewable by everyone"
ON opportunities FOR SELECT
TO authenticated, anon
USING (status = 'published');

CREATE POLICY "Admins can view all opportunities"
ON opportunities FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can insert opportunities"
ON opportunities FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update opportunities"
ON opportunities FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can delete opportunities"
ON opportunities FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- AI_SETTINGS TABLE - Admin only
-- ============================================
CREATE POLICY "Admins can view AI settings"
ON ai_settings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage AI settings"
ON ai_settings FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- PROCESSING_LOGS TABLE - Admin read, service role write
-- ============================================
CREATE POLICY "Admins can view processing logs"
ON processing_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can insert logs"
ON processing_logs FOR INSERT
TO service_role
WITH CHECK (true);


-- DUPLICATE_TRACKING TABLE - Service role only
-- ============================================
CREATE POLICY "Service role can manage duplicate tracking"
ON duplicate_tracking FOR ALL
TO service_role
USING (true);


-- AI_QUEUE TABLE - Service role only
-- ============================================
CREATE POLICY "Service role can manage AI queue"
ON ai_queue FOR ALL
TO service_role
USING (true);


-- ANALYTICS TABLE - Admin read, service role write
-- ============================================
CREATE POLICY "Admins can view analytics"
ON analytics FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can insert analytics"
ON analytics FOR INSERT
TO service_role
WITH CHECK (true);


-- PROCESSING_HISTORY TABLE - Admin read, service role write
-- ============================================
CREATE POLICY "Admins can view processing history"
ON processing_history FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Service role can insert processing history"
ON processing_history FOR INSERT
TO service_role
WITH CHECK (true);


-- PROMPT_TEMPLATES TABLE - Admin only
-- ============================================
CREATE POLICY "Admins can view prompt templates"
ON prompt_templates FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can manage prompt templates"
ON prompt_templates FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);


-- 3. VERIFY ADMIN USER EXISTS
-- ============================================
-- Check if you have an admin profile
-- Run this query separately to see your user ID and role:
-- SELECT id, email FROM auth.users LIMIT 1;
-- Then verify profile:
-- SELECT * FROM profiles WHERE id = '<your-user-id>';

-- If no profile exists, create one (replace with your actual user ID):
-- INSERT INTO profiles (id, role, created_at, updated_at)
-- VALUES ('<your-user-id>', 'admin', NOW(), NOW())
-- ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();

COMMIT;
