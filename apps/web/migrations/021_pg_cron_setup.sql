-- pg_cron Setup: Configure cron jobs to call Edge Functions
-- Run this migration AFTER deploying the Edge Functions to Supabase
-- IMPORTANT: Replace YOUR_PROJECT_REF with your actual Supabase project reference

-- Step 1: Store the Edge Function URL and service key in Vault (run once)
-- Go to Supabase Dashboard > Project Settings > Vault to add these secrets
-- Or run these commands (replace with your actual values):

-- INSERT INTO vault.secrets (name, secret)
-- VALUES
--   ('edge_function_url', 'https://YOUR_PROJECT_REF.supabase.co/functions/v1'),
--   ('service_role_key', 'YOUR_SERVICE_ROLE_KEY');

-- Step 2: Create the cron jobs

-- Job 1: Check RSS feeds every minute
-- This job calls the fetch-rss Edge Function to parse RSS and queue new items
SELECT cron.schedule(
    'fetch-rss-feeds',
    '* * * * *',  -- Every minute
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_function_url') || '/fetch-rss',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Job 2: Process queue items every minute
-- This job calls the process-queue-item Edge Function to process one item at a time
SELECT cron.schedule(
    'process-queue-item',
    '* * * * *',  -- Every minute
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_function_url') || '/process-queue-item',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- Optional: Add a second process-queue-item job offset by 30 seconds for faster processing
-- This effectively processes 2 items per minute
SELECT cron.schedule(
    'process-queue-item-2',
    '* * * * *',  -- Every minute (will run at different offset)
    $$
    -- Wait 30 seconds before processing
    SELECT pg_sleep(30);
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'edge_function_url') || '/process-queue-item',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    ) AS request_id;
    $$
);

-- View all scheduled jobs
-- SELECT * FROM cron.job;

-- View recent job executions
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- To unschedule a job:
-- SELECT cron.unschedule('fetch-rss-feeds');
-- SELECT cron.unschedule('process-queue-item');
-- SELECT cron.unschedule('process-queue-item-2');
