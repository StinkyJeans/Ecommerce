# MongoDB to Supabase Migration Guide

This guide explains how to complete the migration from MongoDB to Supabase.

## Prerequisites

1. **Supabase Project Setup**
   - You should already have a Supabase project with the URL and anon key
   - You'll need the Service Role Key for the migration script

2. **Environment Variables**
   Update your `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   MONGODB_URI=your_mongodb_uri  # Only needed for migration
   ```

## Migration Steps

### Step 1: Create Database Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script to create all tables, indexes, and RLS policies

### Step 2: Migrate Data (Optional)

If you want to migrate existing data from MongoDB:

1. Make sure MongoDB dependencies are installed (they're in devDependencies)
2. Run the migration script:
   ```bash
   node scripts/migrate-to-supabase.js
   ```

   **Note:** The migration script will:
   - Connect to MongoDB
   - Export all data from collections
   - Transform and import to Supabase tables
   - Generate a migration report

### Step 3: Update Environment Variables

Remove `MONGODB_URI` from `.env.local` after migration is complete.

### Step 4: Install Dependencies

```bash
npm install
```

MongoDB and Mongoose are now in devDependencies (only needed for migration script).

## Authentication Changes

### Important Notes:

1. **Email Requirement**: Supabase Auth requires email addresses. The system now:
   - Uses provided email if available
   - Generates temporary email (`username@temp.local`) if no email provided
   - Stores this email in the `users` table for login lookup

2. **Password Migration**: Existing MongoDB passwords cannot be directly migrated because:
   - MongoDB uses bcrypt
   - Supabase Auth uses a different hashing algorithm
   - **Solution**: Users will need to reset their passwords after migration

### Password Reset Options:

1. **Manual Reset**: Users can use Supabase's password reset flow
2. **Temporary Passwords**: Create users with temporary passwords that require reset on first login
3. **Migration Script Enhancement**: The migration script could be enhanced to create users with temporary passwords

## Database Schema

### Tables Created:

1. **users** - Merged User and Seller models
   - `id` (UUID, primary key)
   - `username` (unique)
   - `email`
   - `contact`
   - `id_url`
   - `role` (user, seller, admin)
   - `created_at`, `updated_at`

2. **products** - Product catalog
   - `id` (UUID, primary key)
   - `product_id` (unique string)
   - `seller_username`
   - `product_name`
   - `description`
   - `price`
   - `category`
   - `id_url`
   - `created_at`, `updated_at`

3. **cart_items** - Shopping cart
   - `id` (UUID, primary key)
   - `username`
   - `product_id`
   - `product_name`
   - `description`
   - `price`
   - `id_url`
   - `quantity`
   - `created_at`, `updated_at`

4. **orders** - Order history
   - `id` (UUID, primary key)
   - `username` (buyer)
   - `seller_username`
   - `product_id`
   - `product_name`
   - `price` (numeric)
   - `quantity`
   - `total_amount` (numeric)
   - `status`
   - `created_at`, `updated_at`

## API Changes

All API routes have been updated to use Supabase:

- `/api/login` - Now uses Supabase Auth
- `/api/register` - Now uses Supabase Auth
- `/api/seller/register` - Now uses Supabase Auth
- `/api/getProduct` - Uses Supabase queries
- `/api/getProductByCategory` - Uses Supabase queries
- `/api/goods/addProduct` - Uses Supabase insert
- `/api/sellers/getProducts` - Uses Supabase queries
- `/api/sellers/deleteProduct` - Uses Supabase delete
- `/api/addToCart` - Uses Supabase upsert
- `/api/getCart` - Uses Supabase queries
- `/api/getCartCount` - Uses Supabase count
- `/api/updateCartQuantity` - Uses Supabase update
- `/api/removeFromCart` - Uses Supabase delete
- `/api/getOrders` - **NEW** - Uses Supabase queries
- `/api/logout` - Now uses Supabase Auth signOut

## Row Level Security (RLS)

RLS policies have been created but are currently set to allow all operations. In production, you should update these policies to use Supabase Auth user IDs:

```sql
-- Example: Update cart_items policy
DROP POLICY "Users can read own cart items" ON cart_items;
CREATE POLICY "Users can read own cart items" ON cart_items
  FOR SELECT USING (auth.uid()::text = username);
```

## Testing Checklist

- [ ] Database schema created successfully
- [ ] Data migrated (if applicable)
- [ ] Environment variables configured
- [ ] Test user registration
- [ ] Test user login
- [ ] Test seller registration
- [ ] Test product creation
- [ ] Test cart operations
- [ ] Test order creation/retrieval
- [ ] Verify RLS policies work correctly

## Troubleshooting

### Common Issues:

1. **"Missing Supabase environment variables"**
   - Check `.env.local` has all required variables
   - Restart dev server after adding variables

2. **"Invalid Username or Password" on login**
   - User may need to reset password (see Authentication Changes)
   - Check that email in users table matches Supabase Auth email

3. **Migration script errors**
   - Ensure MongoDB is accessible
   - Check that Supabase service role key has correct permissions
   - Verify database schema is created before running migration

4. **RLS policy errors**
   - Check that policies allow the operations you're trying to perform
   - Consider temporarily disabling RLS for testing: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`

## Next Steps

1. Test all functionality thoroughly
2. Update RLS policies for production security
3. Set up proper error handling and logging
4. Consider implementing password reset flow for migrated users
5. Remove MongoDB dependencies from devDependencies after migration is complete
