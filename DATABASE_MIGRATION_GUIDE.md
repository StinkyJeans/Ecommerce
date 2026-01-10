# Database Migration Guide

This guide helps you fix missing database tables and columns.

## Issue 1: Missing `seller_status` Column

If you're getting the error: `column users.seller_status does not exist`, you need to add this column to your database.

## Quick Fix

### Method 1: Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New query**
5. Copy and paste the contents of `supabase/add-seller-status-column.sql`
6. Click **Run** (or press Ctrl+Enter)

### Method 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're linked to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

Or run the SQL file directly:

```bash
supabase db execute -f supabase/add-seller-status-column.sql
```

### Method 3: Direct SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Add seller_status column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'seller_status'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN seller_status TEXT 
        DEFAULT NULL 
        CHECK (seller_status IN ('pending', 'approved', 'rejected'));
        
        RAISE NOTICE 'seller_status column added successfully';
    ELSE
        RAISE NOTICE 'seller_status column already exists';
    END IF;
END $$;
```

## Verify the Migration

After running the migration, verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Select the `users` table
3. Check if `seller_status` column appears in the columns list

Or run this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'seller_status';
```

You should see a row with `seller_status` and `text` as the data type.

## What This Column Does

The `seller_status` column tracks the approval status of seller accounts:
- `pending` - Seller has registered but not yet approved
- `approved` - Seller has been approved by admin
- `rejected` - Seller registration was rejected
- `NULL` - For regular users (not sellers)

## After Migration

Once the column is added:
1. Refresh your admin dashboard
2. The "View Sellers" page should work correctly
3. You'll be able to see seller approval statuses
4. You can approve/reject sellers from the dashboard

---

## Issue 2: Missing `website_visits` Table

If you're getting the error: `Could not find the table 'public.website_visits'`, you need to create this table.

### Quick Fix

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New query**
5. Copy and paste the contents of `supabase/add-website-visits-table.sql`
6. Click **Run** (or press Ctrl+Enter)

### Direct SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Create website_visits table for tracking page visits
CREATE TABLE IF NOT EXISTS website_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visits_created_at ON website_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_page_path ON website_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON website_visits(visitor_id);

-- Enable Row Level Security
ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Anyone can insert visits" ON website_visits;
CREATE POLICY "Anyone can insert visits" ON website_visits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read visits" ON website_visits;
CREATE POLICY "Admins can read visits" ON website_visits
  FOR SELECT USING (true);
```

### Verify the Migration

After running the migration, verify it worked:

1. Go to **Table Editor** in Supabase Dashboard
2. Check if `website_visits` table appears in the tables list

Or run this query in SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'website_visits';
```

You should see a row with `website_visits` as the table name.

### What This Table Does

The `website_visits` table tracks:
- Page visits across your website
- Visitor information (session IDs)
- User agents and IP addresses
- Timestamps for analytics

This data is used in the admin dashboard to show visit statistics.

---

## Troubleshooting

### Error: "permission denied"
- Make sure you're using the correct database credentials
- Check that you have admin access to the Supabase project

### Error: "column already exists" or "table already exists"
- The column/table is already there, you can ignore this
- The migration scripts are safe to run multiple times

### Still getting errors after migration
- Clear your browser cache
- Restart your Next.js dev server
- Check the browser console for any other errors
- Make sure you've run both migrations if you're missing both the column and the table
