import { createSupabaseAdminClient } from '../src/lib/supabase.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function confirmReset() {
  console.log('\n⚠️  WARNING: This will DELETE ALL DATA from your database!');
  console.log('Tables affected: users, products, cart_items, orders');
  console.log('Auth users (auth.users) will NOT be deleted.\n');
  
  const answer = await question('Are you sure you want to proceed? (yes/no): ');
  return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y';
}

async function checkTablesExist(supabase) {
  const tables = ['users', 'products', 'cart_items', 'orders'];
  const existingTables = [];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (!error) {
        existingTables.push(table);
      }
    } catch (err) {
    }
  }
  
  return existingTables;
}

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...\n');

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing required environment variables:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
      console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
      console.error('\nPlease check your .env.local file.');
      rl.close();
      process.exit(1);
    }

    const supabase = createSupabaseAdminClient();

    console.log('📋 Checking existing tables...');
    const existingTables = await checkTablesExist(supabase);
    
    if (existingTables.length > 0) {
      console.log(`   Found ${existingTables.length} table(s): ${existingTables.join(', ')}`);
    } else {
      console.log('   No tables found (database may already be reset)');
    }

    const confirmed = await confirmReset();
    if (!confirmed) {
      console.log('❌ Reset cancelled by user.');
      rl.close();
      process.exit(0);
    }

    console.log('\n📋 Reading reset SQL file...');
    const resetSqlPath = join(__dirname, '..', 'supabase', 'reset.sql');
    let resetSQL;
    
    try {
      resetSQL = readFileSync(resetSqlPath, 'utf8');
      console.log('✅ Reset SQL file loaded');
    } catch (err) {
      console.error('❌ Error reading reset.sql:', err.message);
      throw new Error('Could not read reset.sql file');
    }

    console.log('\n📝 IMPORTANT: Supabase JS client cannot execute raw SQL directly.');
    console.log('📝 You need to run the SQL script in Supabase Dashboard.\n');
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('   INSTRUCTIONS TO COMPLETE RESET:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('1. Open your Supabase Dashboard');
    console.log('2. Go to: SQL Editor');
    console.log('3. Click "New query"');
    console.log('4. Copy the contents of: supabase/reset.sql');
    console.log('5. Paste into the SQL Editor');
    console.log('6. Click "Run" to execute');
    console.log('7. Verify tables are recreated\n');
    
    console.log('📄 Reset SQL file location:');
    console.log(`   ${resetSqlPath}\n`);
    
    console.log('💡 Alternative: If you have Supabase CLI installed:');
    console.log('   supabase db reset\n');

    console.log('📋 Attempting to clear data from existing tables...');
    
    for (const table of existingTables) {
      try {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.log(`   ⚠️  Could not clear ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ Cleared data from ${table}`);
        }
      } catch (err) {
        console.log(`   ⚠️  Could not clear ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ Reset preparation complete.');
    console.log('📋 Remember to run supabase/reset.sql in Supabase Dashboard to complete the reset.\n');

  } catch (error) {
    console.error('\n❌ Reset failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetDatabase();
