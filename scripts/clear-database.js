/**
 * Script to clear all database data except admin accounts
 * 
 * Usage: node scripts/clear-database.js
 * 
 * WARNING: This will permanently delete all data except admin accounts!
 */

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

async function clearDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data except admin accounts!');
    console.log('   - All users (except admins)');
    console.log('   - All sellers');
    console.log('   - All products');
    console.log('   - All cart items');
    console.log('   - All orders');
    console.log('   - All website visits');
    console.log('');

    const answer = await question('Are you sure you want to continue? (type "yes" to confirm): ');

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled.');
      rl.close();
      process.exit(0);
    }

    console.log('\n🚀 Starting database cleanup...\n');

    const supabase = createSupabaseAdminClient();

    // Step 1: Get admin count before deletion
    const { count: adminCountBefore } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin');

    console.log(`📊 Found ${adminCountBefore || 0} admin account(s) that will be preserved\n`);

    // Step 2: Delete cart items (delete all)
    console.log('🗑️  Deleting cart items...');
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select('id')
      .limit(1000); // Get all cart items
    
    if (cartItems && cartItems.length > 0) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .in('id', cartItems.map(item => item.id));
      if (deleteError) {
        console.error('   ⚠️  Error:', deleteError.message);
      } else {
        console.log(`   ✅ Deleted ${cartItems.length} cart item(s)`);
      }
    } else {
      console.log('   ✅ No cart items to delete');
    }

    // Step 3: Delete orders (delete all)
    console.log('🗑️  Deleting orders...');
    const { data: orders, error: ordersFetchError } = await supabase
      .from('orders')
      .select('id')
      .limit(1000);
    
    if (orders && orders.length > 0) {
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .in('id', orders.map(order => order.id));
      if (ordersError) {
        console.error('   ⚠️  Error:', ordersError.message);
      } else {
        console.log(`   ✅ Deleted ${orders.length} order(s)`);
      }
    } else {
      console.log('   ✅ No orders to delete');
    }

    // Step 4: Delete products (delete all)
    console.log('🗑️  Deleting products...');
    const { data: products, error: productsFetchError } = await supabase
      .from('products')
      .select('id')
      .limit(1000);
    
    if (products && products.length > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .delete()
        .in('id', products.map(product => product.id));
      if (productsError) {
        console.error('   ⚠️  Error:', productsError.message);
      } else {
        console.log(`   ✅ Deleted ${products.length} product(s)`);
      }
    } else {
      console.log('   ✅ No products to delete');
    }

    // Step 5: Delete website visits (delete all)
    console.log('🗑️  Deleting website visits...');
    const { data: visits, error: visitsFetchError } = await supabase
      .from('website_visits')
      .select('id')
      .limit(1000);
    
    if (visits && visits.length > 0) {
      const { error: visitsError } = await supabase
        .from('website_visits')
        .delete()
        .in('id', visits.map(visit => visit.id));
      if (visitsError) {
        console.error('   ⚠️  Error:', visitsError.message);
      } else {
        console.log(`   ✅ Deleted ${visits.length} visit(s)`);
      }
    } else {
      console.log('   ✅ No visits to delete');
    }

    // Step 6: Delete all users except admins
    console.log('🗑️  Deleting users (except admins)...');
    
    // First, get all users to see what we have
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, username, email, role');
    
    if (allUsersError) {
      console.error('   ⚠️  Error fetching users:', allUsersError.message);
    } else {
      console.log(`   📊 Found ${allUsers?.length || 0} total user(s)`);
      
      if (allUsers && allUsers.length > 0) {
        // Show all users first
        console.log('\n   Current users:');
        allUsers.forEach(user => {
          console.log(`      - ${user.username} (${user.email || 'no email'}) [${user.role || 'NULL'}]`);
        });
        console.log('');
      }
      
      // Filter out admins
      const nonAdminUsers = (allUsers || []).filter(user => {
        const role = user.role;
        return role !== 'admin' && role !== null;
      });
      
      const adminUsers = (allUsers || []).filter(user => user.role === 'admin');
      
      console.log(`   👤 Admin users to preserve: ${adminUsers.length}`);
      if (adminUsers.length > 0) {
        adminUsers.forEach(admin => {
          console.log(`      ✅ ${admin.username} (${admin.email || 'no email'})`);
        });
      } else {
        console.log('      ⚠️  WARNING: No admin users found!');
      }
      
      console.log(`\n   🗑️  Non-admin users to delete: ${nonAdminUsers.length}`);
      
      if (nonAdminUsers.length > 0) {
        // Delete each user individually to ensure it works
        let deletedCount = 0;
        let failedCount = 0;
        
        for (const user of nonAdminUsers) {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
          
          if (deleteError) {
            console.error(`      ❌ Failed to delete ${user.username}:`, deleteError.message);
            failedCount++;
          } else {
            console.log(`      ✅ Deleted: ${user.username}`);
            deletedCount++;
          }
        }
        
        console.log(`\n   📊 Summary: ${deletedCount} deleted, ${failedCount} failed`);
        
        if (failedCount > 0) {
          console.log('\n   ⚠️  Some users could not be deleted. This might be due to:');
          console.log('      - Foreign key constraints (users with orders/cart items)');
          console.log('      - RLS policies blocking deletion');
          console.log('      - Try running the SQL script directly in Supabase Dashboard');
        }
      } else {
        console.log('   ✅ No non-admin users to delete');
      }
    }

    // Step 7: Verify admin accounts still exist
    const { data: remainingAdmins, count: adminCountAfter } = await supabase
      .from('users')
      .select('username, email, role', { count: 'exact' })
      .eq('role', 'admin');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ Database cleanup completed!\n');
    console.log('📊 Remaining data:');
    console.log(`   Admin accounts: ${adminCountAfter || 0}`);
    
    if (remainingAdmins && remainingAdmins.length > 0) {
      console.log('\n   Admin accounts preserved:');
      remainingAdmins.forEach(admin => {
        console.log(`   - ${admin.username} (${admin.email || 'no email'})`);
      });
    }

    // Get final counts
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    const { count: cartCount } = await supabase
      .from('cart_items')
      .select('*', { count: 'exact', head: true });
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    const { count: visitsCount } = await supabase
      .from('website_visits')
      .select('*', { count: 'exact', head: true });

    console.log(`   Products: ${productsCount || 0}`);
    console.log(`   Cart items: ${cartCount || 0}`);
    console.log(`   Orders: ${ordersCount || 0}`);
    console.log(`   Website visits: ${visitsCount || 0}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✨ You can now register new users, sellers, and add products!');

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

clearDatabase();
