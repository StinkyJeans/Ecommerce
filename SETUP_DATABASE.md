# Database Setup Guide (Supabase Way)

## Quick Setup (First Time)

If you're seeing the error: **"Could not find the table 'public.users' in the schema cache"**

This means you need to create the database tables first. Follow these steps using Supabase's recommended methods:

## Method 1: Supabase CLI (Recommended - Best Practice) ⭐

This is the **Supabase way** - using their official CLI tool:

1. **Install Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   - Find your project ref in: Supabase Dashboard → Settings → General → Reference ID

4. **Push the schema:**
   ```bash
   supabase db push
   ```
   - This will apply `supabase/schema.sql` to your database

5. **Verify setup:**
   ```bash
   npm run setup:db
   ```

## Method 2: Supabase Dashboard (Quick Setup)

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query** button
5. Open the file `supabase/schema.sql` from your project
6. Copy the **entire contents** of the file
7. Paste into the SQL Editor
8. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

## Method 3: Verify Setup Using SDK

After setting up, verify using the Supabase SDK:

```bash
npm run setup:db
```

This script uses the Supabase SDK to check if all tables exist and provides detailed status.

## Verify Setup

### Using Supabase SDK (Recommended)

```bash
npm run setup:db
```

This will check all tables using the Supabase SDK and show their status.

### Using Supabase Dashboard

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `users`
   - `products`
   - `cart_items`
   - `orders`

## Test Registration

Try registering a new user again. The error should be gone!

## What Gets Created

The schema creates:

- **4 Tables:**
  - `users` - User and seller accounts
  - `products` - Product catalog
  - `cart_items` - Shopping cart items
  - `orders` - Order history

- **Indexes** for better query performance

- **Triggers** to automatically update `updated_at` timestamps

- **RLS Policies** for row-level security (currently set to allow all operations)

- **Functions** for timestamp management

## Troubleshooting

### "Extension uuid-ossp does not exist"
- This is usually auto-enabled in Supabase
- If you see this error, run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";` first

### "Table already exists"
- This means tables are already created
- You can either:
  - Use `reset.sql` to drop and recreate everything
  - Or just continue - your database is already set up!

### "Permission denied"
- Make sure you're logged into the correct Supabase project
- Check that you have the right permissions

### Still seeing "schema cache" error after setup
- Wait a few seconds and try again (cache may need to refresh)
- Check in Table Editor that tables actually exist
- Try refreshing your browser

## Files Reference

- `supabase/schema.sql` - Initial schema creation (use for first-time setup)
- `supabase/reset.sql` - Drop and recreate everything (use for fresh start)
- `supabase/RESET_README.md` - Detailed reset instructions
