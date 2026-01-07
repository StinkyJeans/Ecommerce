# Complete MongoDB to Supabase Migration Documentation

This document provides a comprehensive overview of all changes made during the migration from MongoDB to Supabase, including all subsequent fixes and improvements.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [New Files Created](#new-files-created)
4. [Modified Files](#modified-files)
5. [Authentication System Changes](#authentication-system-changes)
6. [API Routes Migration](#api-routes-migration)
7. [Frontend Changes](#frontend-changes)
8. [Recent Fixes and Improvements](#recent-fixes-and-improvements)
9. [Environment Variables](#environment-variables)
10. [Dependencies](#dependencies)
11. [Setup Instructions](#setup-instructions)

---

## Migration Overview

### What Changed
- **Database**: MongoDB (NoSQL) → Supabase PostgreSQL (SQL)
- **ORM**: Mongoose → Supabase Client SDK
- **Authentication**: Custom bcrypt → Supabase Auth
- **Client Library**: `@supabase/supabase-js` → `@supabase/ssr` (Next.js optimized)

### Migration Timeline
1. **Initial Migration**: MongoDB models converted to PostgreSQL tables
2. **Authentication Migration**: Custom auth replaced with Supabase Auth
3. **API Routes Update**: All routes updated to use Supabase
4. **Best Practices Refactor**: Updated to use `@supabase/ssr` for Next.js
5. **Fresh Start**: Database reset scripts created
6. **Bug Fixes**: Login issues, RLS policies, field name mappings

---

## Database Schema Changes

### Tables Created

#### 1. `users` Table
Merged User and Seller models into a single table with role-based access.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(255),
  id_url TEXT,
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Changes:**
- Single table for both users and sellers (role-based)
- Email field added (required for Supabase Auth)
- UUID primary keys instead of MongoDB ObjectIds

#### 2. `products` Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) UNIQUE NOT NULL,
  seller_username VARCHAR(255) NOT NULL REFERENCES users(username),
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  id_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Changes:**
- `product_id` is a string (generated as `PROD-{timestamp}-{random}`)
- Foreign key relationship to `users` table via `seller_username`
- Price stored as NUMERIC for precision

#### 3. `cart_items` Table
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL REFERENCES users(username),
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  id_url TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, product_id)
);
```

**Key Changes:**
- Denormalized product data (for cart snapshot)
- Unique constraint on (username, product_id)
- Quantity field for cart items

#### 4. `orders` Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL REFERENCES users(username),
  seller_username VARCHAR(255) NOT NULL REFERENCES users(username),
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies

All tables have RLS enabled with the following policies:

- **Users can insert**: `INSERT WITH CHECK (true)` - Allows registration
- **Users can read own data**: `SELECT USING (auth.uid() = id OR username = current_user)`
- **Users can update own data**: `UPDATE USING (username = current_user)`
- **Cart items**: Users can only access their own cart items
- **Products**: Public read, sellers can manage their own products

---

## New Files Created

### Supabase Client Libraries

#### 1. `src/lib/supabase/server.js`
Server-side Supabase client using `@supabase/ssr` with cookie-based authentication.

```javascript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  // ... cookie-based auth setup
}
```

**Purpose**: Used in API routes and Server Components

#### 2. `src/lib/supabase/client.js`
Client-side Supabase client using `@supabase/ssr`.

```javascript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // ... browser client setup
}
```

**Purpose**: Used in Client Components

#### 3. `src/lib/supabase.js`
Admin client for migrations and admin operations (uses service role key).

```javascript
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  // ... admin client with service role key
}
```

**Purpose**: Used in migration scripts and admin operations

### Database Schema Files

#### 4. `supabase/schema.sql`
Complete database schema including:
- Table definitions
- Indexes
- Triggers (for `updated_at` timestamps)
- RLS policies

#### 5. `supabase/reset.sql`
Script to drop and recreate all database objects for a fresh start.

#### 6. `supabase/fix-rls-policy.sql`
Quick fix script for RLS policy issues (allows user registration).

### Migration Scripts

#### 7. `scripts/migrate-to-supabase.js`
Node.js script to migrate data from MongoDB to Supabase.

**Features:**
- Connects to MongoDB
- Exports all collections
- Transforms and imports to Supabase
- Generates migration report

#### 8. `scripts/reset-database.js`
Programmatic database reset using Supabase SDK.

#### 9. `scripts/setup-database.js`
Verifies database setup and checks table existence.

### Documentation Files

#### 10. `MIGRATION_GUIDE.md`
Step-by-step migration instructions

#### 11. `SETUP_DATABASE.md`
Database setup guide

#### 12. `SUPABASE_SETUP.md`
Comprehensive Supabase setup guide

#### 13. `MIGRATION_SUMMARY.md`
Summary of Next.js best practices implementation

#### 14. `supabase/RESET_README.md`
Database reset instructions

#### 15. `supabase/RLS_EXPLANATION.md`
RLS policies explanation

#### 16. `supabase/disable-email-confirmation.md`
Instructions to disable email confirmation

---

## Modified Files

### API Routes (All Updated to Use Supabase)

#### Authentication Routes

1. **`src/app/api/login/route.js`**
   - **Before**: Custom bcrypt password verification
   - **After**: Supabase Auth with username lookup
   - **Key Changes**:
     - Looks up user by username in `users` table
     - Uses email (real or temp) for Supabase Auth
     - Handles email confirmation errors
     - Returns user role and username

2. **`src/app/api/register/route.js`**
   - **Before**: Mongoose User model creation
   - **After**: Supabase Auth + users table insert
   - **Key Changes**:
     - Creates Supabase Auth user
     - Auto-confirms user (for development)
     - Stores email in `users` table
     - Handles RLS policy errors
     - Email field added to regular user registration

3. **`src/app/api/seller/register/route.js`**
   - **Before**: Mongoose Seller model creation
   - **After**: Supabase Auth + users table insert with role='seller'
   - **Key Changes**: Same as register, but with seller role

4. **`src/app/api/logout/route.js`**
   - **Before**: Session cleanup
   - **After**: Supabase Auth sign out

#### Product Routes

5. **`src/app/api/getProduct/route.js`**
   - **Before**: Mongoose Product.find()
   - **After**: Supabase query with field name transformation
   - **Key Changes**:
     - Returns products with both snake_case and camelCase fields
     - Transforms `product_id` → `productId`, etc.

6. **`src/app/api/getProductByCategory/route.js`**
   - **Before**: Mongoose Product.find({ category })
   - **After**: Supabase query with category filter
   - **Key Changes**: Same field transformation as getProduct

7. **`src/app/api/goods/addProduct/route.js`**
   - **Before**: Mongoose Product.create()
   - **After**: Supabase insert
   - **Key Changes**:
     - Generates `product_id` as `PROD-{timestamp}-{random}`
     - Uses `seller_username` instead of seller object

8. **`src/app/api/sellers/getProducts/route.js`**
   - **Before**: Mongoose Product.find({ seller })
   - **After**: Supabase query filtered by `seller_username`
   - **Key Changes**: Field transformation for frontend compatibility

9. **`src/app/api/sellers/deleteProduct/route.js`**
   - **Before**: Mongoose Product.findByIdAndDelete()
   - **After**: Supabase delete by `product_id`

#### Cart Routes

10. **`src/app/api/addToCart/route.js`**
    - **Before**: Mongoose CartItem.create() or update
    - **After**: Supabase insert/update
    - **Key Changes**:
      - Accepts both camelCase and snake_case field names
      - Checks for existing cart item before inserting
      - Updates quantity if product already in cart
      - Enhanced error handling for RLS policies
      - Detailed logging for debugging

11. **`src/app/api/getCart/route.js`**
    - **Before**: Mongoose CartItem.find({ username })
    - **After**: Supabase query filtered by username

12. **`src/app/api/getCartCount/route.js`**
    - **Before**: Mongoose CartItem.countDocuments()
    - **After**: Supabase count query

13. **`src/app/api/updateCartQuantity/route.js`**
    - **Before**: Mongoose CartItem.findByIdAndUpdate()
    - **After**: Supabase update by cart item ID

14. **`src/app/api/removeFromCart/route.js`**
    - **Before**: Mongoose CartItem.findByIdAndDelete()
    - **After**: Supabase delete by cart item ID

#### Order Routes

15. **`src/app/api/getOrders/route.js`**
    - **Before**: Mongoose Order.find()
    - **After**: Supabase query with user filtering

### Frontend Components

16. **`src/app/context/AuthContext.js`**
    - **Before**: Custom session management
    - **After**: Supabase client-side session management
    - **Key Changes**:
      - Uses `@/lib/supabase/client`
      - Listens to Supabase auth state changes
      - Manages user session via cookies

17. **`src/app/dashboard/page.js`**
    - **Key Changes**:
      - Updated `handleAddToCart` to send both field name formats
      - Uses `product_id`/`productId`, `product_name`/`productName`, `id_url`/`idUrl`
      - Handles snake_case from Supabase

18. **`src/app/components/CategoryPage.js`**
    - **Key Changes**:
      - Updated `handleAddToCart` to send proper field names
      - Explicitly maps product fields

19. **`src/app/seller/dashboard/page.js`**
    - **Key Changes**:
      - Updated `handleAddToCart` to use `username` field (not `sellerUsername`)
      - Maps product fields correctly

### Configuration Files

20. **`package.json`**
    - **Added**: `@supabase/ssr` dependency
    - **Moved**: `mongoose` and `mongodb` to devDependencies (for migration script only)

---

## Authentication System Changes

### Before (MongoDB)
- Custom password hashing with bcrypt
- Session stored in memory/cookies
- Username-based login
- Manual password verification

### After (Supabase)
- Supabase Auth handles password hashing
- Cookie-based session management
- Email-based authentication (with username lookup)
- Auto-confirmation for development

### Login Flow Changes

**Old Flow:**
1. User enters username/password
2. Lookup user in MongoDB
3. Compare bcrypt hash
4. Create session

**New Flow:**
1. User enters username/password
2. Lookup user in `users` table by username
3. Get email from user record (or use temp email)
4. Sign in with Supabase Auth using email
5. Supabase manages session via cookies

### Registration Flow Changes

**Old Flow:**
1. Hash password with bcrypt
2. Create user document in MongoDB
3. Return success

**New Flow:**
1. Check if username exists
2. Create Supabase Auth user (requires email)
3. Auto-confirm user (development only)
4. Insert user record in `users` table
5. Return success

### Email Handling

- **Regular Users**: Email field added to registration form
- **Sellers**: No email field (uses temp email)
- **Login**: Uses email internally, but user only provides username
- **Temp Emails**: Format `{username}@temp.local` for users without email

---

## API Routes Migration

### Migration Pattern

All routes follow this pattern:

```javascript
// Before (MongoDB)
import User from '@/models/User';
const user = await User.findOne({ username });

// After (Supabase)
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('username', username)
  .single();
```

### Query Transformations

| MongoDB | Supabase |
|---------|----------|
| `Model.find()` | `supabase.from('table').select('*')` |
| `Model.findOne({ field: value })` | `supabase.from('table').select('*').eq('field', value).single()` |
| `Model.findById(id)` | `supabase.from('table').select('*').eq('id', id).single()` |
| `Model.create(data)` | `supabase.from('table').insert(data).select().single()` |
| `Model.findByIdAndUpdate(id, data)` | `supabase.from('table').update(data).eq('id', id).select().single()` |
| `Model.findByIdAndDelete(id)` | `supabase.from('table').delete().eq('id', id)` |
| `Model.countDocuments({ field: value })` | `supabase.from('table').select('*', { count: 'exact' }).eq('field', value)` |

---

## Frontend Changes

### Field Name Compatibility

**Problem**: Supabase returns snake_case (`product_id`, `product_name`, `id_url`), but frontend expects camelCase (`productId`, `productName`, `idUrl`).

**Solution**: 
1. API routes transform products to include both formats
2. Frontend components accept both formats when sending to API

### Product API Transformation

All product-fetching routes now return:
```javascript
{
  ...product,                    // Original snake_case
  productId: product.product_id,  // camelCase alias
  productName: product.product_name,
  idUrl: product.id_url,
  // ... other aliases
}
```

### Add to Cart Fix

**Issue**: Frontend was sending camelCase, but API expected snake_case.

**Fix**: API now accepts both:
```javascript
const product_id = body.productId || body.product_id;
const product_name = body.productName || body.product_name;
const id_url = body.idUrl || body.id_url;
```

---

## Recent Fixes and Improvements

### 1. Email Confirmation Issue

**Problem**: Login failed with "Email not confirmed" error.

**Solutions Applied**:
- Disabled email confirmation in Supabase Dashboard
- Auto-confirm users during registration using admin client
- Updated login error handling to show specific messages

**Files Changed**:
- `src/app/api/register/route.js`
- `src/app/api/seller/register/route.js`
- `src/app/api/login/route.js`

### 2. RLS Policy Violation

**Problem**: User registration failed with "new row violates row-level security policy".

**Solution**: Added INSERT policy to `users` table:
```sql
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
```

**Files Changed**:
- `supabase/schema.sql`
- `supabase/reset.sql`
- `supabase/fix-rls-policy.sql` (created)

### 3. Field Name Mismatch (Add to Cart)

**Problem**: Adding to cart failed because frontend sent camelCase but API expected snake_case.

**Solutions Applied**:
- API routes now accept both naming conventions
- Product API routes return both formats
- Frontend components updated to send both formats
- Enhanced error logging

**Files Changed**:
- `src/app/api/addToCart/route.js`
- `src/app/api/getProduct/route.js`
- `src/app/api/getProductByCategory/route.js`
- `src/app/api/sellers/getProducts/route.js`
- `src/app/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/seller/dashboard/page.js`

### 4. Username-Only Login

**Problem**: User wanted username/password login, but Supabase requires email.

**Solution**: 
- Login route looks up email from `users` table using username
- Uses email internally for Supabase Auth
- User only provides username and password

**Files Changed**:
- `src/app/api/login/route.js`

### 5. Email Field in Registration

**Problem**: User wanted email field in regular user registration (not seller).

**Solution**: Added email field to regular registration form and API.

**Files Changed**:
- `src/app/api/register/route.js`
- Registration form component (if exists)

---

## Environment Variables

### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# OR (newer format)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

# Admin Operations (for migrations and auto-confirmation)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# MongoDB (only needed for migration script)
MONGODB_URI=your_mongodb_connection_string
```

### Where to Find Supabase Keys

1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

---

## Dependencies

### Added
- `@supabase/supabase-js` - Core Supabase client
- `@supabase/ssr` - Next.js optimized Supabase client with SSR support

### Moved to devDependencies
- `mongoose` - Only needed for migration script
- `mongodb` - Only needed for migration script

### Removed
- Any MongoDB-specific dependencies from production dependencies

### Installation

```bash
npm install
```

---

## Setup Instructions

### Step 1: Supabase Project Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Add them to `.env.local`

### Step 2: Database Schema Setup

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/schema.sql`
3. Paste and run in SQL Editor
4. Verify tables are created (Table Editor)

### Step 3: Disable Email Confirmation (Development)

1. Go to Supabase Dashboard → Authentication → Settings
2. Disable "Enable email confirmations"
3. Or keep enabled and use auto-confirmation in code

### Step 4: Install Dependencies

```bash
npm install
```

### Step 5: Run Migration (Optional)

If you have existing MongoDB data:

```bash
node scripts/migrate-to-supabase.js
```

### Step 6: Test the Application

1. Start development server: `npm run dev`
2. Test user registration
3. Test login
4. Test adding products
5. Test adding to cart
6. Test checkout flow

### Step 7: Fresh Start (If Needed)

If you want to reset the database:

**Option 1: SQL Script**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/reset.sql`
3. Paste and run

**Option 2: Node.js Script**
```bash
node scripts/reset-database.js
```

---

## Testing Checklist

- [ ] User registration (regular user)
- [ ] User registration (seller)
- [ ] Login with username/password
- [ ] Logout
- [ ] Add product (seller)
- [ ] View products
- [ ] Filter products by category
- [ ] Add product to cart
- [ ] View cart
- [ ] Update cart quantity
- [ ] Remove from cart
- [ ] Get cart count
- [ ] Create order
- [ ] View orders

---

## Troubleshooting

### Common Issues

#### 1. "Table not found" Error
**Solution**: Run `supabase/schema.sql` in Supabase SQL Editor

#### 2. "RLS policy violation" Error
**Solution**: Run `supabase/fix-rls-policy.sql` or check RLS policies in Supabase Dashboard

#### 3. "Email not confirmed" Error
**Solution**: 
- Disable email confirmation in Supabase Dashboard
- Or ensure auto-confirmation code is running

#### 4. "Missing fields" Error (Add to Cart)
**Solution**: Check that products have both snake_case and camelCase fields

#### 5. "Invalid login credentials"
**Solution**: 
- Verify user exists in `users` table
- Check email is stored correctly
- Verify password is correct

---

## Migration Statistics

- **Total Files Created**: 16
- **Total Files Modified**: 20
- **API Routes Updated**: 15
- **Frontend Components Updated**: 4
- **Database Tables Created**: 4
- **RLS Policies Created**: 12+
- **Migration Scripts**: 3

---

## Next Steps

1. **Production Deployment**:
   - Enable email confirmation
   - Set up proper RLS policies for production
   - Remove auto-confirmation code
   - Set up environment variables in production

2. **Performance Optimization**:
   - Add database indexes for frequently queried fields
   - Implement caching where appropriate
   - Optimize queries

3. **Security**:
   - Review and tighten RLS policies
   - Implement rate limiting
   - Add input validation
   - Set up monitoring

4. **Features**:
   - Add password reset flow
   - Implement email verification (if needed)
   - Add admin dashboard
   - Implement order status tracking

---

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Changelog

### Latest Changes (Add to Cart Fix)
- Fixed field name mismatch between frontend and API
- Added field name transformation in product APIs
- Enhanced error handling and logging
- Updated all add to cart components

### Previous Changes (Login Fix)
- Fixed email confirmation issue
- Implemented username-only login
- Added email field to user registration
- Improved error messages

### Initial Migration
- Converted all MongoDB models to PostgreSQL tables
- Migrated all API routes to Supabase
- Replaced custom auth with Supabase Auth
- Updated frontend components

---

**Document Version**: 1.0  
**Last Updated**: Current Date  
**Migration Status**: ✅ Complete
