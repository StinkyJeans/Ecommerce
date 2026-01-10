/**
 * Script to create an admin account
 * 
 * Usage: node scripts/create-admin.js <username> <password> <email>
 * 
 * Example: node scripts/create-admin.js admin mypassword admin@example.com
 */

import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '../src/lib/supabase.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

const [,, username, password, email] = process.argv;

if (!username || !password || !email) {
  console.error('Usage: node scripts/create-admin.js <username> <password> <email>');
  console.error('Example: node scripts/create-admin.js admin mypassword admin@example.com');
  process.exit(1);
}

async function createAdmin() {
  try {
    console.log('🚀 Creating admin account...\n');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}\n`);
    
    // Create Supabase client (anon key for regular operations)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existingUser) {
      console.error(`❌ Error: Username "${username}" already exists`);
      process.exit(1);
    }
    
    // Create auth user
    console.log('📝 Creating authentication account...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
          role: 'admin'
        }
      }
    });
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      process.exit(1);
    }
    
    if (!authData.user) {
      console.error('❌ Error: Failed to create authentication account');
      process.exit(1);
    }
    
    console.log('✅ Auth account created');
    
    // Auto-confirm the user using admin client
    console.log('🔐 Confirming email...');
    const adminClient = createSupabaseAdminClient();
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );
    
    if (confirmError) {
      console.error('⚠️  Warning: Error auto-confirming user:', confirmError.message);
    } else {
      console.log('✅ Email confirmed');
    }
    
    // Create user record in users table
    console.log('📋 Creating user record...');
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username: username,
        email: email,
        role: 'admin'
      })
      .select()
      .single();
    
    if (userError) {
      console.error('❌ Error creating user record:', userError.message);
      process.exit(1);
    }
    
    console.log('✅ User record created\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ Admin account created successfully!\n');
    console.log('📌 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}\n`);
    console.log('🌐 Login at: http://localhost:3000');
    console.log('   After login, you\'ll be redirected to: /admin/dashboard');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

createAdmin();
