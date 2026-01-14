import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing services
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { RSSProcessorService } from '../lib/services/rss-processor.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processSingleFeed() {
  console.log('Finding Job Fair feed...\n');

  const { data: feed } = await supabase
    .from('rss_feeds')
    .select('id, name')
    .eq('opportunity_type', 'job_fair')
    .single();

  if (!feed) {
    console.error('No Job Fair feed found!');
    return;
  }

  console.log(`Found feed: ${feed.name} (${feed.id})`);
  console.log('Processing...\n');

  const rssProcessorService = RSSProcessorService.getInstance();
  const result = await rssProcessorService.processFeed(feed.id);

  console.log('\n=== Processing Result ===');
  console.log(JSON.stringify(result, null, 2));
}

processSingleFeed()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
