-- ============================================
-- Create System Settings Table
-- ============================================

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- Create system_settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_category CHECK (category IN ('general', 'ai', 'prompts', 'scraping', 'advanced'))
);

-- Create indexes for fast lookups
CREATE INDEX idx_system_settings_key ON public.system_settings(key);
CREATE INDEX idx_system_settings_category ON public.system_settings(category);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists
DROP POLICY IF EXISTS "system_settings_admin_all" ON public.system_settings;

-- Create policy: Only service role can access (for API routes)
CREATE POLICY "system_settings_admin_all"
ON public.system_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.system_settings (key, value, description, category) VALUES
    ('general.automatic_processing', 'true', 'Enable automatic RSS feed processing', 'general'),
    ('general.processing_interval', '60', 'Processing interval in minutes', 'general'),
    ('general.auto_publish', 'false', 'Automatically publish opportunities that pass threshold', 'general'),
    ('general.quality_threshold', '0.7', 'Minimum AI confidence score to accept', 'general'),
    ('general.max_posts_per_run', '10', 'Maximum posts to process in one run', 'general'),
    ('scraping.request_timeout', '10000', 'HTTP request timeout in milliseconds', 'scraping'),
    ('scraping.max_redirects', '5', 'Maximum number of redirects to follow', 'scraping'),
    ('scraping.min_content_length', '100', 'Minimum content length to accept', 'scraping'),
    ('scraping.max_content_length', '50000', 'Maximum content length to process', 'scraping'),
    ('scraping.user_agent', '"Gellobit RSS Bot/1.0"', 'User agent string for HTTP requests', 'scraping'),
    ('scraping.follow_google_feedproxy', 'true', 'Resolve Google FeedProxy URLs', 'scraping'),
    ('advanced.log_retention_days', '30', 'Days to keep processing logs', 'advanced'),
    ('advanced.debug_mode', 'false', 'Enable debug logging', 'advanced');
