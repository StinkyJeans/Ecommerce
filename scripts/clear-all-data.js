import { createSupabaseAdminClient } from '../src/lib/supabase.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function clearAllData() {
  try {
    console.log('\n⚠️  ⚠️  ⚠️  WARNING ⚠️  ⚠️  ⚠️');
    console.log('This will DELETE ALL DATA from your database!');
    console.log('This includes:');
    console.log('   - ALL users (including admins)');
    console.log('   - ALL products');
    console.log('   - ALL cart items');
    console.log('   - ALL orders');
    console.log('   - ALL website visits');
    console.log('   - ALL chat conversations');
    console.log('   - ALL chat messages');
    console.log('   - ALL shipping addresses');
    console.log('   - EVERYTHING!\n');

    const answer = await question('Type "DELETE ALL" to confirm: ');

    if (answer !== 'DELETE ALL') {
      console.log('❌ Operation cancelled. Nothing was deleted.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🚀 Starting complete database wipe...\n');

    const supabase = createSupabaseAdminClient();

    // Get counts before deletion
    const tables = [
      'messages',
      'conversations',
      'cart_items',
      'orders',
      'shipping_addresses',
      'products',
      'website_visits',
      'users'
    ];

    console.log('📊 Current data counts:');
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        console.log(`   ${table}: ${count || 0}`);
      } catch (err) {
        console.log(`   ${table}: Error checking (${err.message})`);
      }
    }

    console.log('\n🗑️  Deleting data...\n');

    // Delete in order to respect foreign key constraints
    const deleteOrder = [
      'messages',           // Must delete first (references conversations)
      'conversations',      // Must delete before users
      'cart_items',         // References products and users
      'orders',             // References users and products
      'shipping_addresses', // References users
      'products',           // References users (sellers)
      'website_visits',     // References users
      'users'               // Delete last
    ];

    for (const table of deleteOrder) {
      try {
        console.log(`🗑️  Deleting from ${table}...`);
        
        // For users, we need to delete all (no filter)
        if (table === 'users') {
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(10000);
          
          if (error) {
            console.error(`   ⚠️  Error fetching ${table}:`, error.message);
            continue;
          }
          
          if (data && data.length > 0) {
            // Delete in batches
            const batchSize = 100;
            let deleted = 0;
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .in('id', batch.map(item => item.id));
              
              if (deleteError) {
                console.error(`   ⚠️  Error deleting batch:`, deleteError.message);
              } else {
                deleted += batch.length;
              }
            }
            console.log(`   ✅ Deleted ${deleted} record(s) from ${table}`);
          } else {
            console.log(`   ✅ No data in ${table}`);
          }
        } else {
          // For other tables, try to delete all
          const { data, error: fetchError } = await supabase
            .from(table)
            .select('id')
            .limit(10000);
          
          if (fetchError) {
            console.error(`   ⚠️  Error fetching ${table}:`, fetchError.message);
            continue;
          }
          
          if (data && data.length > 0) {
            // Delete in batches
            const batchSize = 100;
            let deleted = 0;
            for (let i = 0; i < data.length; i += batchSize) {
              const batch = data.slice(i, i + batchSize);
              const { error: deleteError } = await supabase
                .from(table)
                .delete()
                .in('id', batch.map(item => item.id));
              
              if (deleteError) {
                console.error(`   ⚠️  Error deleting batch:`, deleteError.message);
              } else {
                deleted += batch.length;
              }
            }
            console.log(`   ✅ Deleted ${deleted} record(s) from ${table}`);
          } else {
            console.log(`   ✅ No data in ${table}`);
          }
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${table}:`, err.message);
      }
    }

    // Verify deletion
    console.log('\n📊 Verifying deletion...\n');
    let allCleared = true;
    for (const table of tables) {
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        const countValue = count || 0;
        if (countValue > 0) {
          console.log(`   ⚠️  ${table}: ${countValue} record(s) remaining`);
          allCleared = false;
        } else {
          console.log(`   ✅ ${table}: 0 records`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${table}: Could not verify (${err.message})`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    if (allCleared) {
      console.log('✅ All data successfully deleted!');
    } else {
      console.log('⚠️  Some data may remain. Check the warnings above.');
      console.log('💡 Tip: Run the SQL script directly in Supabase Dashboard for complete deletion.');
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 Note: Auth users (auth.users) are NOT deleted by this script.');
    console.log('   If you want to delete auth users too, run this SQL in Supabase Dashboard:');
    console.log('   DELETE FROM auth.users;\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

clearAllData();
