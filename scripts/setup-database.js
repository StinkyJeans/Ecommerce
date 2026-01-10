import { createSupabaseAdminClient } from '../src/lib/supabase.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function checkTableExists(supabase, tableName) {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    return !error || error.code === 'PGRST116';
  } catch (err) {
    return false;
  }
}

async function getTableInfo(supabase, tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      return { exists: false, count: 0, error: error.message };
    }
    
    return { exists: true, count: count || 0 };
  } catch (err) {
    return { exists: false, count: 0, error: err.message };
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Database Setup Verification using Supabase SDK\n');

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing required environment variables:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL);
      console.error('   - SUPABASE_SERVICE_ROLE_KEY:', !!SUPABASE_SERVICE_KEY);
      console.error('\nPlease check your .env.local file.');
      process.exit(1);
    }

    console.log('✅ Environment variables configured');
    console.log(`   Supabase URL: ${SUPABASE_URL.substring(0, 30)}...\n`);

    const supabase = createSupabaseAdminClient();

    console.log('📋 Checking database tables using Supabase SDK...\n');
    const tables = ['users', 'products', 'cart_items', 'orders'];
    const tableStatus = [];

    for (const table of tables) {
      const info = await getTableInfo(supabase, table);
      tableStatus.push({ name: table, ...info });
      
      if (info.exists) {
        console.log(`   ✅ ${table.padEnd(15)} - Exists (${info.count} rows)`);
      } else {
        console.log(`   ❌ ${table.padEnd(15)} - Missing`);
        if (info.error) {
          console.log(`      Error: ${info.error}`);
        }
      }
    }

    const existingTables = tableStatus.filter(t => t.exists);
    const missingTables = tableStatus.filter(t => !t.exists);

    console.log('\n═══════════════════════════════════════════════════════════');

    if (missingTables.length === 0) {
      console.log('✅ All tables exist! Database is ready to use.\n');
      return;
    }

    console.log('⚠️  Some tables are missing. Setup required.\n');
    console.log('📝 Recommended Setup Methods (Supabase Way):\n');
    
    console.log('Method 1: Supabase CLI (Recommended - Best Practice)');
    console.log('─────────────────────────────────────────────────────');
    console.log('1. Install Supabase CLI:');
    console.log('   npm install -g supabase');
    console.log('');
    console.log('2. Login to Supabase:');
    console.log('   supabase login');
    console.log('');
    console.log('3. Link your project:');
    console.log('   supabase link --project-ref YOUR_PROJECT_REF');
    console.log('   (Find project ref in Supabase Dashboard → Settings → General)');
    console.log('');
    console.log('4. Push the schema:');
    console.log('   supabase db push');
    console.log('   (This will apply supabase/schema.sql)\n');

    console.log('Method 2: Supabase Dashboard (Quick Setup)');
    console.log('──────────────────────────────────────────');
    console.log('1. Go to: https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Navigate to: SQL Editor');
    console.log('4. Click: New query');
    console.log('5. Copy contents of: supabase/schema.sql');
    console.log('6. Paste and click: Run\n');

    console.log('Method 3: Verify After Setup');
    console.log('────────────────────────────');
    console.log('After running the schema, run this script again to verify:');
    console.log('   node scripts/setup-database.js\n');

    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Setup verification failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

setupDatabase();
