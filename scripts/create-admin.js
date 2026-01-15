import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
  process.exit(1);
}

if (!supabaseServiceRoleKey) {
  console.error('❌ Error: Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('This is required to auto-confirm the admin account.');
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  console.error('You can find it in Supabase Dashboard > Settings > API > service_role key');
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
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();
    
    if (existingUser) {
      console.error(`❌ Error: Username "${username}" already exists`);
      process.exit(1);
    }
    
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
    
    console.log('🔐 Confirming email...');
    // Create admin client using service role key directly
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    const { error: confirmError } = await adminClient.auth.admin.updateUserById(
      authData.user.id,
      { email_confirm: true }
    );
    
    if (confirmError) {
      console.error('⚠️  Warning: Error auto-confirming user:', confirmError.message);
      console.error('   You may need to confirm the email manually via Supabase Dashboard');
      console.error('   Or check that SUPABASE_SERVICE_ROLE_KEY is correct');
    } else {
      console.log('✅ Email confirmed');
    }
    
    console.log('📋 Creating user record...');
    // Use admin client to bypass RLS when inserting user record
    const { data: newUser, error: userError } = await adminClient
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
      console.error('   Error code:', userError.code);
      console.error('   Error details:', userError.details);
      console.error('\n   Troubleshooting:');
      console.error('   1. Check if the "users" table exists');
      console.error('   2. Check if RLS policies allow inserts');
      console.error('   3. Try running the database migrations first');
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
