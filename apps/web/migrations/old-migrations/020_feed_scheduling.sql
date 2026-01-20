-- Feed Scheduling: Add fields for specific time scheduling and queue processing
-- Run this migration in Supabase SQL Editor

-- Enable required extensions for cron and HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Add scheduling fields to rss_feeds
ALTER TABLE rss_feeds
ADD COLUMN IF NOT EXISTS schedule_type VARCHAR(20) DEFAULT 'interval' CHECK (schedule_type IN ('interval', 'daily')),
ADD COLUMN IF NOT EXISTS scheduled_hour INTEGER CHECK (scheduled_hour >= 0 AND scheduled_hour <= 23),
ADD COLUMN IF NOT EXISTS scheduled_minute INTEGER DEFAULT 0 CHECK (scheduled_minute >= 0 AND scheduled_minute <= 59),
ADD COLUMN IF NOT EXISTS items_pending INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_rss_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'idle' CHECK (processing_status IN ('idle', 'fetching', 'processing'));

-- Add comments for documentation
COMMENT ON COLUMN rss_feeds.schedule_type IS 'Schedule type: interval (use cron_interval) or daily (use scheduled_hour)';
COMMENT ON COLUMN rss_feeds.scheduled_hour IS 'Hour to run (0-23) when schedule_type is daily. e.g., 1 = 1:00 AM, 14 = 2:00 PM';
COMMENT ON COLUMN rss_feeds.scheduled_minute IS 'Minute to run (0-59) when schedule_type is daily';
COMMENT ON COLUMN rss_feeds.items_pending IS 'Number of RSS items pending to be processed';
COMMENT ON COLUMN rss_feeds.last_rss_check IS 'When the RSS feed was last parsed for new items';
COMMENT ON COLUMN rss_feeds.processing_status IS 'Current processing status: idle, fetching (parsing RSS), processing (creating posts)';

-- Create index for efficient scheduling queries
CREATE INDEX IF NOT EXISTS idx_rss_feeds_schedule ON rss_feeds(schedule_type, scheduled_hour, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_rss_feeds_pending ON rss_feeds(items_pending) WHERE status = 'active' AND items_pending > 0;

-- Create processing queue table for individual items
CREATE TABLE IF NOT EXISTS feed_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_id UUID NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
    item_url TEXT NOT NULL,
    item_title TEXT,
    item_content TEXT,
    item_image_url TEXT,
    item_pub_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'duplicate')),
    error_message TEXT,
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(feed_id, item_url)
);

-- Add indexes for queue processing
CREATE INDEX IF NOT EXISTS idx_queue_status ON feed_processing_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queue_feed ON feed_processing_queue(feed_id, status);

-- Add comments
COMMENT ON TABLE feed_processing_queue IS 'Queue for processing individual RSS items one at a time';

-- Enable RLS on queue table
ALTER TABLE feed_processing_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin full access to queue" ON feed_processing_queue
    FOR ALL USING (true);

-- Function to check if a feed should run based on its schedule
CREATE OR REPLACE FUNCTION should_feed_run(
    p_schedule_type VARCHAR,
    p_scheduled_hour INTEGER,
    p_scheduled_minute INTEGER,
    p_cron_interval VARCHAR,
    p_last_fetched TIMESTAMP WITH TIME ZONE,
    p_last_rss_check TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_hour INTEGER;
    v_current_minute INTEGER;
    v_interval_minutes INTEGER;
    v_minutes_since_last_check INTEGER;
BEGIN
    v_current_hour := EXTRACT(HOUR FROM NOW());
    v_current_minute := EXTRACT(MINUTE FROM NOW());

    -- For daily schedule, check if it's the right hour and minute (within 1 min window)
    IF p_schedule_type = 'daily' THEN
        -- Check if we already ran today at this hour
        IF p_last_rss_check IS NOT NULL AND
           DATE(p_last_rss_check) = CURRENT_DATE AND
           EXTRACT(HOUR FROM p_last_rss_check) = p_scheduled_hour THEN
            RETURN FALSE;
        END IF;

        -- Check if it's the scheduled time (within 1 minute window)
        IF v_current_hour = p_scheduled_hour AND
           v_current_minute >= COALESCE(p_scheduled_minute, 0) AND
           v_current_minute <= COALESCE(p_scheduled_minute, 0) + 1 THEN
            RETURN TRUE;
        END IF;

        RETURN FALSE;
    END IF;

    -- For interval schedule, check time since last check
    IF p_schedule_type = 'interval' OR p_schedule_type IS NULL THEN
        -- Never checked, should run
        IF p_last_rss_check IS NULL THEN
            RETURN TRUE;
        END IF;

        -- Convert interval to minutes
        v_interval_minutes := CASE p_cron_interval
            WHEN 'every_5_minutes' THEN 5
            WHEN 'every_15_minutes' THEN 15
            WHEN 'every_30_minutes' THEN 30
            WHEN 'hourly' THEN 60
            WHEN 'every_2_hours' THEN 120
            WHEN 'every_6_hours' THEN 360
            WHEN 'every_12_hours' THEN 720
            WHEN 'daily' THEN 1440
            ELSE 60 -- default hourly
        END;

        v_minutes_since_last_check := EXTRACT(EPOCH FROM (NOW() - p_last_rss_check)) / 60;

        RETURN v_minutes_since_last_check >= v_interval_minutes;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to get the next feed that needs RSS check
CREATE OR REPLACE FUNCTION get_next_feed_for_rss_check()
RETURNS TABLE (
    feed_id UUID,
    feed_name VARCHAR,
    feed_url TEXT,
    opportunity_type VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.name,
        f.url,
        f.opportunity_type
    FROM rss_feeds f
    WHERE f.status = 'active'
      AND f.processing_status = 'idle'
      AND should_feed_run(
          f.schedule_type,
          f.scheduled_hour,
          f.scheduled_minute,
          f.cron_interval,
          f.last_fetched,
          f.last_rss_check
      )
    ORDER BY f.priority DESC, f.last_rss_check ASC NULLS FIRST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get the next queue item to process
CREATE OR REPLACE FUNCTION get_next_queue_item()
RETURNS TABLE (
    queue_id UUID,
    feed_id UUID,
    feed_name VARCHAR,
    opportunity_type VARCHAR,
    item_url TEXT,
    item_title TEXT,
    item_content TEXT,
    item_image_url TEXT,
    enable_scraping BOOLEAN,
    enable_ai_processing BOOLEAN,
    auto_publish BOOLEAN,
    ai_provider VARCHAR,
    ai_model VARCHAR,
    quality_threshold DECIMAL,
    fallback_featured_image_url TEXT
) AS $$
DECLARE
    v_queue_id UUID;
BEGIN
    -- Get and lock the next pending item
    SELECT q.id INTO v_queue_id
    FROM feed_processing_queue q
    WHERE q.status = 'pending'
    ORDER BY q.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_queue_id IS NULL THEN
        RETURN;
    END IF;

    -- Mark as processing
    UPDATE feed_processing_queue
    SET status = 'processing', attempts = attempts + 1
    WHERE id = v_queue_id;

    -- Return the item with feed config
    RETURN QUERY
    SELECT
        q.id,
        q.feed_id,
        f.name,
        f.opportunity_type,
        q.item_url,
        q.item_title,
        q.item_content,
        q.item_image_url,
        f.enable_scraping,
        f.enable_ai_processing,
        f.auto_publish,
        f.ai_provider,
        f.ai_model,
        f.quality_threshold,
        f.fallback_featured_image_url
    FROM feed_processing_queue q
    JOIN rss_feeds f ON f.id = q.feed_id
    WHERE q.id = v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark queue item as completed
CREATE OR REPLACE FUNCTION complete_queue_item(
    p_queue_id UUID,
    p_status VARCHAR DEFAULT 'completed',
    p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE feed_processing_queue
    SET
        status = p_status,
        processed_at = NOW(),
        error_message = p_error_message
    WHERE id = p_queue_id;

    -- Update feed's pending count
    UPDATE rss_feeds f
    SET items_pending = (
        SELECT COUNT(*)
        FROM feed_processing_queue q
        WHERE q.feed_id = f.id AND q.status = 'pending'
    )
    WHERE id = (SELECT feed_id FROM feed_processing_queue WHERE id = p_queue_id);
END;
$$ LANGUAGE plpgsql;

-- Function to add items to the queue (called after RSS parsing)
CREATE OR REPLACE FUNCTION add_items_to_queue(
    p_feed_id UUID,
    p_items JSONB -- Array of {url, title, content, image_url, pub_date}
) RETURNS INTEGER AS $$
DECLARE
    v_item JSONB;
    v_count INTEGER := 0;
BEGIN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        BEGIN
            INSERT INTO feed_processing_queue (
                feed_id,
                item_url,
                item_title,
                item_content,
                item_image_url,
                item_pub_date,
                status
            ) VALUES (
                p_feed_id,
                v_item->>'url',
                v_item->>'title',
                v_item->>'content',
                v_item->>'image_url',
                (v_item->>'pub_date')::TIMESTAMP WITH TIME ZONE,
                'pending'
            );
            v_count := v_count + 1;
        EXCEPTION WHEN unique_violation THEN
            -- Item already in queue, skip
            NULL;
        END;
    END LOOP;

    -- Update feed's pending count and last_rss_check
    UPDATE rss_feeds
    SET
        items_pending = (
            SELECT COUNT(*)
            FROM feed_processing_queue q
            WHERE q.feed_id = p_feed_id AND q.status = 'pending'
        ),
        last_rss_check = NOW(),
        processing_status = 'idle'
    WHERE id = p_feed_id;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
