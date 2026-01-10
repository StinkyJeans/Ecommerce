# Clear Database Guide

This guide explains how to clear all data from your database while preserving admin accounts.

## ⚠️ Warning

This operation will **permanently delete**:
- All users (except admins)
- All sellers
- All products
- All cart items
- All orders
- All website visits

**Only admin accounts will be preserved.**

---

## Method 1: Using the Script (Recommended)

The easiest way is to use the provided script:

```bash
npm run clear:data
```

The script will:
1. Ask for confirmation (type "yes" to proceed)
2. Delete all data except admin accounts
3. Show you what was deleted
4. Verify admin accounts are still intact

---

## Method 2: Using Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor**
4. Click **New query**
5. Copy and paste the contents of `supabase/clear-all-data-except-admin.sql`
6. Click **Run** (or press Ctrl+Enter)

---

## Method 3: Direct SQL

Run this SQL in your Supabase SQL Editor:

```sql
-- Clear all data except admin accounts

-- Step 1: Delete all cart items
DELETE FROM cart_items;

-- Step 2: Delete all orders
DELETE FROM orders;

-- Step 3: Delete all products
DELETE FROM products;

-- Step 4: Delete all website visits
DELETE FROM website_visits;

-- Step 5: Delete all users EXCEPT admins
DELETE FROM users 
WHERE role != 'admin' OR role IS NULL;

-- Verify: Show remaining users (should only be admins)
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;
```

---

## What Gets Preserved

✅ **Admin accounts** - All users with `role = 'admin'` will remain

## What Gets Deleted

❌ All regular users  
❌ All sellers  
❌ All products  
❌ All cart items  
❌ All orders  
❌ All website visits  

---

## After Clearing

Once you've cleared the database:

1. ✅ Your admin account(s) will still work
2. ✅ You can register new users
3. ✅ You can register new sellers
4. ✅ You can add new products
5. ✅ Users can add items to cart
6. ✅ Fresh start with clean data

---

## Verify the Cleanup

After running the cleanup, verify it worked:

### Check remaining users:
```sql
SELECT username, email, role FROM users;
```
Should only show admin accounts.

### Check other tables:
```sql
SELECT COUNT(*) as count FROM products;        -- Should be 0
SELECT COUNT(*) as count FROM cart_items;      -- Should be 0
SELECT COUNT(*) as count FROM orders;          -- Should be 0
SELECT COUNT(*) as count FROM website_visits;  -- Should be 0
```

---

## Troubleshooting

### Error: "permission denied"
- Make sure you're using admin credentials
- Check that you have proper access to the Supabase project

### Admin accounts were deleted
- If you accidentally deleted admin accounts, you can recreate them using:
  ```bash
  npm run create:admin <username> <password> <email>
  ```

### Still seeing old data
- Clear your browser cache
- Restart your Next.js dev server
- Check the database directly in Supabase Dashboard

---

## Safety Tips

1. **Backup first** (if needed) - Export data before clearing
2. **Double-check admin accounts** - Make sure you have at least one admin account before clearing
3. **Test in development** - Try this in a development environment first if possible

---

## Quick Start

**Fastest way to clear database:**

```bash
# Run the script
npm run clear:data

# Type "yes" when prompted
# Wait for confirmation
# Done! You can now register new users and sellers
```

That's it! Your database is now clean and ready for fresh data.
