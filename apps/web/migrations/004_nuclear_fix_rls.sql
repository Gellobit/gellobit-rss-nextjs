-- ============================================
-- NUCLEAR FIX - Completely Rebuild RLS Policies
-- ============================================
-- This script will:
-- 1. Temporarily disable RLS on all tables
-- 2. Drop ALL existing policies
-- 3. Recreate simple policies that avoid recursion
-- 4. Re-enable RLS
-- ============================================

-- STEP 1: Disable RLS temporarily
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds DISABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queue DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates DISABLE ROW LEVEL SECURITY;


-- STEP 2: Drop ALL policies (brute force)
-- ============================================
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname
              FROM pg_policies
              WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                      r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;


-- STEP 3: Create NEW simple policies
-- ============================================

-- PROFILES TABLE
-- ============================================
-- Everyone can read all profiles (no recursion)
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile on signup
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);


-- RSS_FEEDS TABLE
-- ============================================
-- Service role has full access (for API routes)
CREATE POLICY "feeds_service_role_all"
ON rss_feeds FOR ALL
TO service_role
USING (true);

-- Authenticated users can only SELECT
CREATE POLICY "feeds_select_auth"
ON rss_feeds FOR SELECT
TO authenticated
USING (true);


-- OPPORTUNITIES TABLE
-- ============================================
-- Public can view published opportunities
CREATE POLICY "opportunities_select_published_anon"
ON opportunities FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Service role has full access
CREATE POLICY "opportunities_service_role_all"
ON opportunities FOR ALL
TO service_role
USING (true);


-- AI_SETTINGS TABLE
-- ============================================
-- Service role has full access
CREATE POLICY "ai_settings_service_role_all"
ON ai_settings FOR ALL
TO service_role
USING (true);

-- Authenticated users can SELECT
CREATE POLICY "ai_settings_select_auth"
ON ai_settings FOR SELECT
TO authenticated
USING (true);


-- PROCESSING_LOGS TABLE
-- ============================================
CREATE POLICY "logs_service_role_all"
ON processing_logs FOR ALL
TO service_role
USING (true);

CREATE POLICY "logs_select_auth"
ON processing_logs FOR SELECT
TO authenticated
USING (true);


-- DUPLICATE_TRACKING TABLE
-- ============================================
CREATE POLICY "duplicate_service_role_all"
ON duplicate_tracking FOR ALL
TO service_role
USING (true);


-- AI_QUEUE TABLE
-- ============================================
CREATE POLICY "queue_service_role_all"
ON ai_queue FOR ALL
TO service_role
USING (true);


-- ANALYTICS TABLE
-- ============================================
CREATE POLICY "analytics_service_role_all"
ON analytics FOR ALL
TO service_role
USING (true);

CREATE POLICY "analytics_select_auth"
ON analytics FOR SELECT
TO authenticated
USING (true);


-- PROCESSING_HISTORY TABLE
-- ============================================
CREATE POLICY "history_service_role_all"
ON processing_history FOR ALL
TO service_role
USING (true);

CREATE POLICY "history_select_auth"
ON processing_history FOR SELECT
TO authenticated
USING (true);


-- PROMPT_TEMPLATES TABLE
-- ============================================
CREATE POLICY "prompts_service_role_all"
ON prompt_templates FOR ALL
TO service_role
USING (true);

CREATE POLICY "prompts_select_auth"
ON prompt_templates FOR SELECT
TO authenticated
USING (true);


-- STEP 4: Re-enable RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;


-- STEP 5: Verify your admin profile exists
-- ============================================
-- Check your user ID and profile
SELECT
    u.id as user_id,
    u.email,
    p.role as current_role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- If you don't see your profile or role is not 'admin', run this:
-- Replace <your-user-id> with your actual UUID from above query
--
-- INSERT INTO profiles (id, role, created_at, updated_at)
-- VALUES ('<your-user-id>', 'admin', NOW(), NOW())
-- ON CONFLICT (id)
-- DO UPDATE SET role = 'admin', updated_at = NOW();

COMMIT;
