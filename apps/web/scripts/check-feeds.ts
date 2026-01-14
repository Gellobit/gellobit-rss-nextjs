import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkFeeds() {
  console.log('Checking feeds in database...\n');

  const { data: feeds, error } = await supabase
    .from('rss_feeds')
    .select('*');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${feeds?.length || 0} feeds:\n`);

  if (feeds) {
    for (const feed of feeds) {
      console.log(`- ${feed.name}`);
      console.log(`  URL: ${feed.url}`);
      console.log(`  Status: ${feed.status}`);
      console.log(`  Type: ${feed.opportunity_type}`);
      console.log(`  Provider: ${feed.ai_provider || 'global'}`);
      console.log(`  Enable AI: ${feed.enable_ai_processing}`);
      console.log(`  Enable Scraping: ${feed.enable_scraping}`);
      console.log('');
    }
  }
}

checkFeeds().then(() => process.exit(0));
