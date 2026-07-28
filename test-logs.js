import { readProtectionLogStore } from './lib/panel-protection-logs.js';
import { getSupabaseAdmin } from './lib/supabase-admin.js';

async function test() {
  console.log('Testing readProtectionLogStore...');
  try {
    const result = await readProtectionLogStore(getSupabaseAdmin());
    console.log(`Success! Loaded ${result.entries.length} entries.`);
  } catch (err) {
    console.error('Error:', err);
  }
}

test();