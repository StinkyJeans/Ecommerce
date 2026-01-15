/**
 * Simple Admin Account Creator
 * Uses the registration API route to create an admin account
 * 
 * Usage: node scripts/create-admin-simple.js <username> <password> <email>
 * Example: node scripts/create-admin-simple.js admin mypassword123 admin@example.com
 */

import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const [,, username, password, email] = process.argv;

if (!username || !password || !email) {
  console.error('❌ Usage: node scripts/create-admin-simple.js <username> <password> <email>');
  console.error('   Example: node scripts/create-admin-simple.js admin mypassword123 admin@example.com');
  process.exit(1);
}

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function createAdmin() {
  try {
    console.log('🚀 Creating admin account via API...\n');
    console.log(`   Username: ${username}`);
    console.log(`   Email: ${email}\n`);

    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: username,
        password: password,
        email: email,
        role: 'admin'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error creating admin account:');
      if (data.errors && Array.isArray(data.errors)) {
        data.errors.forEach(err => console.error(`   - ${err}`));
      } else {
        console.error(`   ${data.message || data.error || 'Unknown error'}`);
      }
      process.exit(1);
    }

    console.log('✅ Admin account created successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📌 Login Credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Email: ${email}\n`);
    console.log('🌐 Login at: http://localhost:3000');
    console.log('   After login, you\'ll be redirected to: /admin/dashboard');
    console.log('═══════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n   Make sure:');
    console.error('   1. Your Next.js dev server is running (npm run dev)');
    console.error('   2. The API route /api/register is accessible');
    console.error('   3. Your .env.local file has the correct Supabase credentials');
    process.exit(1);
  }
}

createAdmin();
