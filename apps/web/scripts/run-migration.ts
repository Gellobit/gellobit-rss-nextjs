import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAndReportColumns() {
  console.log('Checking database columns...\n');

  // Check rss_feeds columns
  const { data: feedData, error: feedError } = await supabase
    .from('rss_feeds')
    .select('*')
    .limit(1);

  if (feedError) {
    console.error('Error checking rss_feeds:', feedError.message);
  } else if (feedData && feedData.length > 0) {
    console.log('rss_feeds columns:', Object.keys(feedData[0]).join(', '));
    console.log('\nshow_source_link exists:', 'show_source_link' in feedData[0]);
  }

  // Check system_settings
  const { data: settingsData, error: settingsError } = await supabase
    .from('system_settings')
    .select('key, value')
    .like('key', 'cleanup.%');

  if (settingsError) {
    console.error('\nError checking system_settings:', settingsError.message);
  } else {
    console.log('\nCleanup settings:', settingsData);
  }
}

checkAndReportColumns().then(() => process.exit(0));
