# Database Reset Guide

This directory contains scripts to completely reset your Supabase database to a fresh state.

## ⚠️ WARNING

**These scripts will DELETE ALL DATA from:**
- `users` table
- `products` table
- `cart_items` table
- `orders` table

**Auth users** (`auth.users` table) will **NOT** be affected.

## Quick Start

### Option 1: SQL Script (Recommended - Easiest)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New query**
5. Copy the entire contents of `reset.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify tables are recreated

### Option 2: Node.js Script

```bash
node scripts/reset-database.js
```

The script will:
- Check for existing tables
- Ask for confirmation
- Provide step-by-step instructions
- Attempt to clear existing data (if possible)

**Note:** The Node.js script cannot execute raw SQL directly, so you'll still need to run `reset.sql` in the Supabase Dashboard. The script provides helpful guidance and can clear data from existing tables.

## What Gets Reset

### Dropped:
- All tables (users, products, cart_items, orders)
- All triggers
- All functions
- All indexes
- All RLS policies

### Recreated:
- All tables with fresh schema
- All triggers for `updated_at` timestamps
- All functions (update_updated_at_column)
- All indexes for performance
- All RLS policies (currently set to allow all operations)

## After Reset

1. Your database will be completely empty
2. All tables will be recreated with the schema from `schema.sql`
3. You can start registering new users and adding products
4. Auth users in `auth.users` will remain (you may want to clear those separately if needed)

## Troubleshooting

### "Table does not exist" errors
- This is normal if the database is already reset
- The script uses `IF EXISTS` clauses, so it's safe to run multiple times

### "Permission denied" errors
- Make sure you're using the **Service Role Key** (not the anon key)
- Check that your Supabase project has the correct permissions

### Tables not recreating
- Check the SQL Editor for any error messages
- Verify that the UUID extension is enabled
- Make sure you copied the entire `reset.sql` file

## Files

- `reset.sql` - Complete SQL script to drop and recreate everything
- `schema.sql` - Original schema file (used as reference)
- `RESET_README.md` - This file
