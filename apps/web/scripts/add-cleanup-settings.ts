/**
 * Add cleanup settings to the database
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addSettings() {
  console.log('Adding cleanup settings to database...\n');

  // Note: system_settings uses JSONB for value and category is restricted
  // Using 'advanced' category since 'cleanup' is not in the constraint
  const settings = [
    {
      key: 'cleanup.auto_expire_enabled',
      value: true,  // JSONB value
      description: 'Automatically remove expired opportunities',
      category: 'advanced',
    },
    {
      key: 'cleanup.days_after_deadline',
      value: 7,  // JSONB value
      description: 'Days after deadline before removing opportunity',
      category: 'advanced',
    },
    {
      key: 'cleanup.max_age_days_no_deadline',
      value: 30,  // JSONB value
      description: 'Maximum age (in days) for opportunities without deadline',
      category: 'advanced',
    },
    {
      key: 'cleanup.run_interval_hours',
      value: 24,  // JSONB value
      description: 'How often to run the cleanup job (in hours)',
      category: 'advanced',
    },
  ];

  for (const setting of settings) {
    const { error } = await supabase
      .from('system_settings')
      .upsert(setting, { onConflict: 'key' });

    if (error) {
      console.error(`Failed to add ${setting.key}:`, error.message);
    } else {
      console.log(`Added: ${setting.key} = ${setting.value}`);
    }
  }

  console.log('\nDone!');
}

addSettings().then(() => process.exit(0));
