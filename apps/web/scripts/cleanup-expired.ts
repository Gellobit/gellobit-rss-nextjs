/**
 * Cleanup Expired Opportunities Script
 *
 * This script removes opportunities that have passed their deadline.
 * Run via cron job or manually:
 *
 *   npx tsx scripts/cleanup-expired.ts
 *
 * Recommended cron schedule: Daily at 3am
 *   0 3 * * * cd /path/to/app && npx tsx scripts/cleanup-expired.ts
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local before importing services
dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { cleanupService } from '../lib/services/cleanup.service';

async function main() {
  console.log('='.repeat(60));
  console.log('Cleanup Expired Opportunities');
  console.log('Started at:', new Date().toISOString());
  console.log('='.repeat(60));
  console.log('');

  // Get stats before cleanup
  console.log('Pre-cleanup statistics:');
  const statsBefore = await cleanupService.getExpirationStats();
  console.log(`  - Already expired: ${statsBefore.expiredCount}`);
  console.log(`  - Expiring in 7 days: ${statsBefore.expiringIn7Days}`);
  console.log(`  - Expiring in 30 days: ${statsBefore.expiringIn30Days}`);
  console.log(`  - No deadline set: ${statsBefore.noDeadlineCount}`);
  console.log('');

  // Run cleanup
  console.log('Running cleanup...');
  const result = await cleanupService.cleanupExpiredOpportunities();

  console.log('');
  console.log('='.repeat(60));
  console.log('Cleanup Results:');
  console.log(`  - Success: ${result.success}`);
  console.log(`  - Deleted: ${result.deletedCount} opportunities`);

  if (result.errors.length > 0) {
    console.log(`  - Errors (${result.errors.length}):`);
    result.errors.forEach(err => console.log(`    - ${err}`));
  }

  console.log('');
  console.log('Completed at:', new Date().toISOString());
  console.log('='.repeat(60));

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
