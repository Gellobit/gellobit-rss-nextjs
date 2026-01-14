import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing services
dotenv.config({ path: resolve(__dirname, '../.env.local') });

console.log('Loading RSS Processor Service...');

import { RSSProcessorService } from '../lib/services/rss-processor.service';

console.log('RSS Processor Service loaded.');

async function processFeeds() {
  console.log('Processing all active feeds...\n');
  console.log('Calling processAllFeeds()...');

  const rssProcessorService = RSSProcessorService.getInstance();
  const results = await rssProcessorService.processAllFeeds();

  // Calculate summary
  const summary = {
    total_feeds_processed: results.length,
    successful_feeds: results.filter((r) => r.success).length,
    failed_feeds: results.filter((r) => !r.success).length,
    total_opportunities_created: results.reduce((sum, r) => sum + r.opportunitiesCreated, 0),
    total_duplicates_skipped: results.reduce((sum, r) => sum + r.duplicatesSkipped, 0),
    total_ai_rejections: results.reduce((sum, r) => sum + r.aiRejections, 0),
    total_errors: results.reduce((sum, r) => sum + r.errors, 0),
  };

  console.log('\n=== Processing Summary ===');
  console.log(`Feeds processed: ${summary.total_feeds_processed}`);
  console.log(`Successful: ${summary.successful_feeds}`);
  console.log(`Failed: ${summary.failed_feeds}`);
  console.log(`Opportunities created: ${summary.total_opportunities_created}`);
  console.log(`Duplicates skipped: ${summary.total_duplicates_skipped}`);
  console.log(`AI rejections: ${summary.total_ai_rejections}`);
  console.log(`Errors: ${summary.total_errors}`);

  console.log('\n=== Feed Details ===');
  for (const result of results) {
    console.log(`\n${result.feedName}:`);
    console.log(`  - Success: ${result.success}`);
    console.log(`  - Created: ${result.opportunitiesCreated}`);
    console.log(`  - Duplicates: ${result.duplicatesSkipped}`);
    console.log(`  - AI Rejections: ${result.aiRejections}`);
    if (result.error) {
      console.log(`  - Error: ${result.error}`);
    }
  }
}

processFeeds()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
