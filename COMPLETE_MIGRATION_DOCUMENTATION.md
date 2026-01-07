# MongoDB to Supabase Migration Documentation

Complete overview of the migration from MongoDB to Supabase, including all fixes and improvements.

## Table of Contents

1. [Quick Overview](#quick-overview)
2. [Database Schema](#database-schema)
3. [Key Files](#key-files)
4. [Authentication Changes](#authentication-changes)
5. [API Migration Pattern](#api-migration-pattern)
6. [Bug Fixes](#bug-fixes)
7. [Setup & Deployment](#setup--deployment)
8. [Troubleshooting](#troubleshooting)
9. [Changelog](#changelog)

---

## Quick Overview

### What Changed
- **Database**: MongoDB → Supabase PostgreSQL
- **ORM**: Mongoose → Supabase Client SDK
- **Authentication**: Custom bcrypt → Supabase Auth
- **Client**: `@supabase/supabase-js` → `@supabase/ssr`

### Timeline
1. Initial migration (models → tables)
2. Authentication migration
3. API routes update
4. Best practices refactor
5. Bug fixes (login, RLS, field names, cart, deployment)

---

## Database Schema

### Tables

**`users`** - Merged User and Seller models
- `id` (UUID), `username` (unique), `email`, `role` (user/seller/admin)

**`products`**
- `id` (UUID), `product_id` (unique string), `seller_username`, `product_name`, `price`, `category`

**`cart_items`**
- `id` (UUID), `username`, `product_id`, `quantity`, denormalized product data

**`orders`**
- `id` (UUID), `username`, `seller_username`, `product_id`, `quantity`, `total_amount`, `status`

### RLS Policies
- Users can insert (registration)
- Users can read/update own data
- Products: public read, sellers manage own
- Cart: users access own items only

---

## Key Files

### Supabase Clients

**`src/lib/supabase/server.js`** - Server-side (API routes, Server Components)
```javascript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

**`src/lib/supabase/client.js`** - Client-side (Client Components)
```javascript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

**`src/lib/supabase.js`** - Admin client (migrations, admin ops)
```javascript
import { createSupabaseAdminClient } from '@/lib/supabase';
const supabase = createSupabaseAdminClient();
```

### Database Scripts
- `supabase/schema.sql` - Complete schema
- `supabase/reset.sql` - Drop and recreate all tables
- `scripts/migrate-to-supabase.js` - Data migration script
- `scripts/reset-database.js` - Programmatic reset
- `scripts/setup-database.js` - Verify setup

### Documentation
- `VERCEL_DEPLOYMENT.md` - Vercel deployment guide
- `MIGRATION_GUIDE.md` - Migration instructions
- `SETUP_DATABASE.md` - Database setup

---

## Authentication Changes

### Login Flow
**Before**: Username → MongoDB lookup → bcrypt compare → session

**After**: Username → `users` table lookup → get email → Supabase Auth (email/password) → cookie session

### Registration Flow
**Before**: Hash password → Create MongoDB document

**After**: Check username → Create Supabase Auth user → Auto-confirm → Insert `users` table

### Email Handling
- Regular users: Email field in registration
- Sellers: Temp email (`username@temp.local`)
- Login: Username-only (email looked up internally)

---

## API Migration Pattern

### Query Transformations

| MongoDB | Supabase |
|---------|----------|
| `Model.find()` | `supabase.from('table').select('*')` |
| `Model.findOne({ field: value })` | `.eq('field', value).single()` |
| `Model.create(data)` | `.insert(data).select().single()` |
| `Model.findByIdAndUpdate(id, data)` | `.update(data).eq('id', id).select().single()` |
| `Model.findByIdAndDelete(id)` | `.delete().eq('id', id)` |

### Updated Routes (15 total)
- Authentication: login, register, seller/register, logout
- Products: getProduct, getProductByCategory, addProduct, getProducts, deleteProduct
- Cart: addToCart, getCart, getCartCount, updateCartQuantity, removeFromCart
- Orders: getOrders

---

## Bug Fixes

### 1. Shopping Cart Operations (December 2024)

**Issue**: Plus/minus/delete buttons not working

**Root Cause**: Cart page used MongoDB's `_id` but Supabase uses `id` (UUID)

**Files Changed**:
- `src/app/cart/viewCart/page.js` - Changed `item._id` → `item.id` (14 occurrences)
- `src/app/api/getCart/route.js` - Added field transformation

**Code Changes**:

**Deleted/Changed:**
```javascript
// BEFORE: item._id (MongoDB)
setCartItems(prevItems => prevItems.filter(item => item._id !== itemId));
onClick={() => handleRemove(item._id)}
key={item._id}

// AFTER: item.id (Supabase)
setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
onClick={() => handleRemove(item.id)}
key={item.id}
```

**Added:**
```javascript
// getCart API - Field transformation
const transformedCart = (cart || []).map(item => ({
  ...item,
  idUrl: item.id_url,
  productName: item.product_name,
}));

// Cart page - Support both formats
src={item.id_url || item.idUrl}
alt={item.product_name || item.productName}
```

**Result**: ✅ All cart operations work correctly

### 2. Field Name Mismatch (Add to Cart)

**Issue**: Frontend sent camelCase, API expected snake_case

**Files Changed**: `addToCart/route.js`, `getProduct/route.js`, `getProductByCategory/route.js`, `sellers/getProducts/route.js`, `dashboard/page.js`, `CategoryPage.js`, `seller/dashboard/page.js`

**Fix**: API accepts both formats
```javascript
// API accepts both
const product_id = body.productId || body.product_id;
const product_name = body.productName || body.product_name;

// API returns both
const transformedProducts = products.map(p => ({
  ...p,
  productId: p.product_id,
  productName: p.product_name,
  idUrl: p.id_url,
}));
```

### 3. Email Confirmation

**Issue**: "Email not confirmed" error on login

**Files Changed**: `register/route.js`, `seller/register/route.js`, `login/route.js`

**Fix**: 
- Disabled email confirmation in Supabase Dashboard
- Auto-confirm users during registration using admin client

### 4. RLS Policy Violation

**Issue**: "new row violates row-level security policy" on registration

**Files Changed**: `supabase/schema.sql`, `supabase/reset.sql`, `supabase/fix-rls-policy.sql`

**Fix**: Added INSERT policy
```sql
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
```

### 5. Vercel Deployment

**Issue**: Build fails with "Missing Supabase environment variables"

**Files Changed**: `lib/supabase/client.js`, `lib/supabase/server.js`, `context/AuthContext.js`

**Fix**:
- Client returns `null` during SSR when env vars missing
- AuthContext handles null client gracefully
- See `VERCEL_DEPLOYMENT.md` for setup

### 6. Seller Add to Cart Issue (December 2024)

**Issue**: Sellers getting "Please log in to add items to your cart" error when trying to add products to cart

**Root Cause**: Seller dashboard was checking for `sellerUsername` instead of `username` for cart operations. The `username` field is set for all authenticated users (including sellers) in AuthContext, but the code was only checking `sellerUsername`.

**Files Changed**:
- `src/app/seller/dashboard/page.js` - Updated to use `username` for cart operations

**Code Changes**:

**Deleted/Changed:**
```javascript
// BEFORE: Checking sellerUsername (causes error)
const { username } = useAuth();
const { sellerUsername } = useAuth();
if (!sellerUsername) {
  setCartMessage("login");
  return;
}
username: sellerUsername
```

**After:**
```javascript
// AFTER: Using username (works for all users including sellers)
const { username, sellerUsername } = useAuth();
if (!username) {
  setCartMessage("login");
  return;
}
username: username
```

**Result**: ✅ Sellers can now add items to cart successfully

---

## Setup & Deployment

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_key
# OR
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # Optional
```

**Where to find**: Supabase Dashboard → Settings → API

### Setup Steps

1. Create Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Add environment variables to `.env.local`
4. Install dependencies: `npm install`
5. (Optional) Run migration: `node scripts/migrate-to-supabase.js`

### Vercel Deployment

1. Set environment variables in Vercel Dashboard
2. Enable for Production, Preview, Development
3. Redeploy after setting variables

See `VERCEL_DEPLOYMENT.md` for detailed instructions.

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Table not found" | Run `supabase/schema.sql` in SQL Editor |
| "RLS policy violation" | Run `supabase/fix-rls-policy.sql` |
| "Email not confirmed" | Disable email confirmation in Supabase Dashboard |
| "Missing fields" (Add to Cart) | Check products have both snake_case and camelCase |
| "Cart operations not working" | Use `item.id` instead of `item._id` |
| "Missing env variables" (Vercel) | Set variables in Vercel Dashboard and redeploy |
| "Please log in to add items" (Seller) | Use `username` instead of `sellerUsername` for cart operations |

---

## Changelog

### December 2024

**Seller Add to Cart Fix**
- Fixed "Please log in to add items to your cart" error for sellers
- Changed from `sellerUsername` to `username` for cart operations
- Removed duplicate `useAuth()` call
- Files: `seller/dashboard/page.js`

**Shopping Cart Fix**
- Fixed cart operations (plus/minus/delete buttons)
- Changed `item._id` → `item.id` (14 occurrences)
- Added field transformation in getCart API
- Files: `cart/viewCart/page.js`, `api/getCart/route.js`

**Vercel Deployment Fix**
- Fixed build-time errors when env vars missing
- Made Supabase client resilient during SSR
- Added graceful error handling in AuthContext
- Files: `lib/supabase/client.js`, `lib/supabase/server.js`, `context/AuthContext.js`

**Add to Cart Fix**
- Fixed field name mismatch (camelCase vs snake_case)
- API accepts both naming conventions
- Added field transformation in product APIs
- Files: Multiple API routes and frontend components

**Login & Registration Fixes**
- Fixed email confirmation issue
- Implemented username-only login
- Added email field to user registration
- Fixed RLS policy violations
- Files: `api/login/route.js`, `api/register/route.js`, `api/seller/register/route.js`

### Initial Migration
- Converted MongoDB models to PostgreSQL tables
- Migrated all 15 API routes to Supabase
- Replaced custom auth with Supabase Auth
- Updated frontend components

---

**Version**: 1.3  
**Last Updated**: December 2024  
**Status**: ✅ Complete & Production Ready
