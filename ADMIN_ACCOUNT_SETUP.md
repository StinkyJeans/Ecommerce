# Admin Account Setup Guide

This guide explains how to create an admin account for accessing the admin dashboard.

## Method 1: Using the Script (Recommended)

The easiest way to create an admin account is using the provided script:

```bash
npm run create:admin <username> <password> <email>
```

**Example:**
```bash
npm run create:admin admin mypassword123 admin@example.com
```

**Requirements:**
- Make sure your `.env.local` file has:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for auto-confirming the account)

**What the script does:**
1. Checks if username already exists
2. Creates Supabase Auth account
3. Auto-confirms the email
4. Creates user record in `users` table with `role: 'admin'`

**After running the script:**
- Login at: `http://localhost:3000`
- Use the username and password you provided
- You'll be automatically redirected to `/admin/dashboard`

---

## Method 2: Using the Registration API

You can also create an admin account by calling the registration API with `role: "admin"`:

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "yourpassword",
    "email": "admin@example.com",
    "role": "admin"
  }'
```

**Using JavaScript (browser console or script):**
```javascript
fetch('/api/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'yourpassword',
    email: 'admin@example.com',
    role: 'admin'
  })
})
.then(res => res.json())
.then(data => console.log(data));
```

**Note:** This method requires the registration API to accept the `role` parameter. The current implementation does accept it.

---

## Method 3: Direct Database Insert (Supabase Dashboard)

If you prefer to create the admin account directly in the database:

1. **Go to Supabase Dashboard** → SQL Editor
2. **Run this SQL** (replace with your values):

```sql
-- First, create the auth user (you'll need to do this via Supabase Auth or use the script)
-- Then insert into users table:

INSERT INTO users (username, email, role)
VALUES ('admin', 'admin@example.com', 'admin');
```

**Important:** This method only creates the user record. You'll still need to:
- Create the Supabase Auth account separately
- Link the auth user ID to the users table record (if needed)

---

## Method 4: Update Existing User to Admin

If you already have a user account and want to make it an admin:

1. **Go to Supabase Dashboard** → Table Editor → `users` table
2. **Find your user** by username or email
3. **Edit the row** and change `role` from `'user'` to `'admin'`
4. **Save**

Or use SQL:
```sql
UPDATE users 
SET role = 'admin' 
WHERE username = 'your_username';
```

---

## Verifying Admin Account

After creating the admin account, verify it works:

1. **Login** at `http://localhost:3000` with your admin credentials
2. **Check redirect**: You should be redirected to `/admin/dashboard`
3. **Verify access**: You should see:
   - Statistics cards (Users, Sellers, Products, Visits, Pending)
   - Pending sellers list
   - Visit statistics

---

## Troubleshooting

### "Forbidden: Admin access required"
- **Cause**: Your account doesn't have `role: 'admin'` in the `users` table
- **Fix**: Update your user's role to 'admin' in the database

### "Unauthorized" error
- **Cause**: Not logged in or session expired
- **Fix**: Login again at the main page

### Script fails with "Missing Supabase environment variables"
- **Cause**: `.env.local` file not found or missing variables
- **Fix**: 
  1. Create `.env.local` in project root
  2. Add required environment variables
  3. Run script again

### Script fails with "Username already exists"
- **Cause**: Username is already taken
- **Fix**: Use a different username

---

## Security Notes

- **Admin accounts have full access** to:
  - Approve/reject sellers
  - View all user data
  - View all statistics
  - Access admin dashboard

- **Keep admin credentials secure**
- **Don't share admin accounts**
- **Use strong passwords**

---

## Default Admin Account

There is **no default admin account**. You must create one using one of the methods above.

---

## Quick Start

**Fastest way to create admin account:**

```bash
# 1. Make sure .env.local has all required variables
# 2. Run the script:
npm run create:admin admin yourpassword admin@example.com

# 3. Login at http://localhost:3000
# 4. You'll be redirected to /admin/dashboard
```

That's it! You now have admin access.
