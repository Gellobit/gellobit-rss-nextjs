import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearData() {
  console.log('Clearing test data...\n');

  // Delete all opportunities
  const { data: deleted, error } = await supabase
    .from('opportunities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id');

  if (error) {
    console.error('Error deleting opportunities:', error);
  } else {
    console.log(`Deleted ${deleted?.length || 0} opportunities`);
  }

  // Clear duplicate tracking
  const { error: dtError } = await supabase
    .from('duplicate_tracking')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (dtError) {
    console.error('Error clearing duplicate tracking:', dtError);
  } else {
    console.log('Cleared duplicate tracking');
  }

  // Clear processing logs
  const { error: logError } = await supabase
    .from('processing_logs')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (logError) {
    console.error('Error clearing logs:', logError);
  } else {
    console.log('Cleared processing logs');
  }

  console.log('\nDone! You can now re-test the feeds.');
}

clearData().then(() => process.exit(0));
