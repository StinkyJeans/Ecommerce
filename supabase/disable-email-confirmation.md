# Disable Email Confirmation in Supabase

To allow users to login immediately after registration (username + password only), you need to disable email confirmation.

## Method 1: Supabase Dashboard (Recommended)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **Settings** (or **Providers** → **Email**)
4. Find **"Enable email confirmations"** or **"Confirm email"**
5. **Toggle it OFF**
6. Click **Save**

## Method 2: Using SQL (Alternative)

If you have access to the auth schema, you can run:

```sql
-- Note: This might not work depending on your Supabase plan
-- The setting is usually in the Dashboard, not SQL

-- Check current auth settings
SELECT * FROM auth.config;
```

## Why This is Needed

Supabase Auth requires email confirmation by default. When a user registers:
- User is created in `auth.users` but `email_confirmed_at` is NULL
- User cannot login until they confirm their email
- This blocks username/password login

## After Disabling

Once disabled:
- Users can login immediately after registration
- No email confirmation required
- Username + password login works right away

## Auto-Confirm in Code

The registration route now also auto-confirms users using the admin client, but disabling email confirmation in the Dashboard is the primary solution.
