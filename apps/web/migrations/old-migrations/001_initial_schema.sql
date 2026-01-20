-- Gellobit RSS Processor - Complete Database Schema
-- Migration: 001_initial_schema
-- Created: 2026-01-12

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: profiles (User profiles with role-based access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 2: rss_feeds (RSS feed configurations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rss_feeds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    opportunity_type VARCHAR(50) NOT NULL,
    enable_scraping BOOLEAN DEFAULT true,
    enable_ai_processing BOOLEAN DEFAULT true,
    auto_publish BOOLEAN DEFAULT true,
    ai_provider VARCHAR(50) DEFAULT 'default',
    keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    exclude_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    quality_threshold NUMERIC(3,2) DEFAULT 0.60 CHECK (quality_threshold >= 0 AND quality_threshold <= 1),
    feed_interval VARCHAR(50) DEFAULT 'hourly',
    last_fetched TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    error_count INTEGER DEFAULT 0,
    total_processed INTEGER DEFAULT 0,
    total_published INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rss_feeds_status ON public.rss_feeds(status);
CREATE INDEX idx_rss_feeds_last_fetched ON public.rss_feeds(last_fetched);
CREATE INDEX idx_rss_feeds_opportunity_type ON public.rss_feeds(opportunity_type);

-- Enable RLS
ALTER TABLE public.rss_feeds ENABLE ROW LEVEL SECURITY;

-- Policies for rss_feeds
CREATE POLICY "Admins can manage feeds" ON public.rss_feeds
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 3: opportunities (Generated opportunities/posts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    opportunity_type VARCHAR(50) NOT NULL,
    deadline TIMESTAMP WITH TIME ZONE,
    prize_value VARCHAR(255),
    requirements TEXT,
    location VARCHAR(255),
    source_url TEXT NOT NULL,
    source_feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE SET NULL,
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    featured_image_url TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected')),
    rejection_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX idx_opportunities_type ON public.opportunities(opportunity_type);
CREATE INDEX idx_opportunities_status ON public.opportunities(status);
CREATE INDEX idx_opportunities_published_at ON public.opportunities(published_at DESC);
CREATE INDEX idx_opportunities_source_feed ON public.opportunities(source_feed_id);
CREATE INDEX idx_opportunities_slug ON public.opportunities(slug);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Policies for opportunities
CREATE POLICY "Public can view published opportunities" ON public.opportunities
    FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all opportunities" ON public.opportunities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 4: ai_settings (AI provider configurations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('openai', 'anthropic', 'deepseek', 'gemini')),
    api_key TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT false,
    max_tokens INTEGER DEFAULT 1500,
    temperature NUMERIC(3,2) DEFAULT 0.1 CHECK (temperature >= 0 AND temperature <= 2),
    rate_limit_per_hour INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only one active AI setting at a time
CREATE UNIQUE INDEX idx_active_ai_setting ON public.ai_settings(is_active) WHERE is_active = true;
CREATE INDEX idx_ai_settings_provider ON public.ai_settings(provider);

-- Enable RLS
ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

-- Policies for ai_settings
CREATE POLICY "Admins can manage AI settings" ON public.ai_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 5: processing_logs (Debug and audit logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL CHECK (level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    context JSONB,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_logs_level ON public.processing_logs(level);
CREATE INDEX idx_logs_created_at ON public.processing_logs(created_at DESC);
CREATE INDEX idx_logs_feed_id ON public.processing_logs(feed_id);

-- Enable RLS
ALTER TABLE public.processing_logs ENABLE ROW LEVEL SECURITY;

-- Policies for processing_logs
CREATE POLICY "Admins can view all logs" ON public.processing_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 6: duplicate_tracking (Prevent duplicate content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.duplicate_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_hash VARCHAR(64) UNIQUE NOT NULL,
    title_hash VARCHAR(64) NOT NULL,
    url_hash VARCHAR(64) NOT NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    similarity_score NUMERIC(3,2) CHECK (similarity_score >= 0 AND similarity_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_duplicate_content_hash ON public.duplicate_tracking(content_hash);
CREATE INDEX idx_duplicate_title_hash ON public.duplicate_tracking(title_hash);
CREATE INDEX idx_duplicate_url_hash ON public.duplicate_tracking(url_hash);
CREATE INDEX idx_duplicate_feed_id ON public.duplicate_tracking(feed_id);
CREATE INDEX idx_duplicate_opportunity_id ON public.duplicate_tracking(opportunity_id);

-- Enable RLS
ALTER TABLE public.duplicate_tracking ENABLE ROW LEVEL SECURITY;

-- Policies for duplicate_tracking
CREATE POLICY "Admins can view duplicates" ON public.duplicate_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 7: ai_queue (AI processing queue)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
    content_hash VARCHAR(64) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 5,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_queue_status ON public.ai_queue(status);
CREATE INDEX idx_queue_priority ON public.ai_queue(priority DESC);
CREATE INDEX idx_queue_scheduled ON public.ai_queue(scheduled_for);

-- Enable RLS
ALTER TABLE public.ai_queue ENABLE ROW LEVEL SECURITY;

-- Policies for ai_queue
CREATE POLICY "Admins can view queue" ON public.ai_queue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 8: analytics (Metrics and statistics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_value NUMERIC(15,4) NOT NULL,
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    opportunity_type VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, metric_type, feed_id, opportunity_type)
);

CREATE INDEX idx_analytics_date ON public.analytics(date DESC);
CREATE INDEX idx_analytics_metric_type ON public.analytics(metric_type);
CREATE INDEX idx_analytics_feed_id ON public.analytics(feed_id);

-- Enable RLS
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

-- Policies for analytics
CREATE POLICY "Admins can view analytics" ON public.analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 9: processing_history (Audit trail of all processing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.processing_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feed_id UUID REFERENCES public.rss_feeds(id) ON DELETE CASCADE,
    feed_name VARCHAR(255),
    ai_provider VARCHAR(50),
    item_title TEXT,
    item_url TEXT,
    status VARCHAR(20) CHECK (status IN ('published', 'rejected')),
    reason TEXT,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_history_feed_id ON public.processing_history(feed_id);
CREATE INDEX idx_history_status ON public.processing_history(status);
CREATE INDEX idx_history_created_at ON public.processing_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.processing_history ENABLE ROW LEVEL SECURITY;

-- Policies for processing_history
CREATE POLICY "Admins can view history" ON public.processing_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- TABLE 10: prompt_templates (Custom AI prompts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_type VARCHAR(50) UNIQUE NOT NULL,
    unified_prompt TEXT NOT NULL,
    default_prompt TEXT NOT NULL,
    is_customized BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_prompts_opportunity_type ON public.prompt_templates(opportunity_type);

-- Enable RLS
ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

-- Policies for prompt_templates
CREATE POLICY "Admins can manage prompts" ON public.prompt_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rss_feeds_updated_at BEFORE UPDATE ON public.rss_feeds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON public.opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON public.prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Seed opportunity types for prompt_templates (will be populated later with actual prompts)
INSERT INTO public.prompt_templates (opportunity_type, unified_prompt, default_prompt, is_customized)
VALUES
    ('contest', '', '', false),
    ('giveaway', '', '', false),
    ('sweepstakes', '', '', false),
    ('dream_job', '', '', false),
    ('get_paid_to', '', '', false),
    ('instant_win', '', '', false),
    ('job_fair', '', '', false),
    ('scholarship', '', '', false),
    ('volunteer', '', '', false),
    ('free_training', '', '', false),
    ('promo', '', '', false)
ON CONFLICT (opportunity_type) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE public.rss_feeds IS 'RSS feed configurations for automated processing';
COMMENT ON TABLE public.opportunities IS 'Generated opportunities from RSS feeds';
COMMENT ON TABLE public.ai_settings IS 'AI provider configurations (OpenAI, Claude, DeepSeek, Gemini)';
COMMENT ON TABLE public.processing_logs IS 'Debug and audit logs for all operations';
COMMENT ON TABLE public.duplicate_tracking IS 'Tracks processed content to prevent duplicates';
COMMENT ON TABLE public.ai_queue IS 'Queue for AI processing tasks with retry logic';
COMMENT ON TABLE public.analytics IS 'Aggregated metrics and statistics';
COMMENT ON TABLE public.processing_history IS 'Complete audit trail of RSS item processing';
COMMENT ON TABLE public.prompt_templates IS 'Custom AI prompts by opportunity type';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
