# Vercel Deployment Guide

## Environment Variables Setup

To deploy your Next.js application to Vercel, you need to configure the following environment variables in your Vercel project settings.

### Step 1: Go to Vercel Project Settings

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**

### Step 2: Add Required Environment Variables

Add the following environment variables:

#### Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```

**AND one of these:**

```
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

**OR (legacy):**

```
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Optional (for admin operations)

```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** The service role key is only needed if you're running migration scripts or need admin access. It's not required for the application to run.

### Step 3: Where to Find Supabase Values

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (new) or **anon public key** (legacy) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY` (if needed)

### Step 4: Set Environment for All Environments

Make sure to set the environment variables for:
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

You can do this by:
1. Adding the variable
2. Selecting all three checkboxes (Production, Preview, Development)
3. Clicking **Save**

### Step 5: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

## Troubleshooting

### Error: "Missing Supabase environment variables"

**Cause:** Environment variables are not set in Vercel or are set incorrectly.

**Solution:**
1. Verify all environment variables are set in Vercel Settings → Environment Variables
2. Make sure variable names match exactly (case-sensitive)
3. Ensure variables are enabled for the correct environment (Production/Preview/Development)
4. Redeploy after adding/updating variables

### Error: "Prerender error" or "Build failed"

**Cause:** Environment variables are missing during build time.

**Solution:**
1. Make sure `NEXT_PUBLIC_*` variables are set (they're needed at build time)
2. Check that variables are enabled for **Production** environment
3. Try redeploying after verifying variables

### Variables Not Updating

**Cause:** Vercel caches environment variables.

**Solution:**
1. After updating variables, you **must** redeploy
2. Environment variables are only loaded during build time
3. Use **Redeploy** button or push a new commit

## Verification

After deployment, verify your environment variables are working:

1. Check the deployment logs for any errors
2. Test the application functionality:
   - User registration
   - User login
   - Product display
   - Cart operations

## Security Notes

- ✅ `NEXT_PUBLIC_*` variables are safe to expose (they're public)
- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` should **NOT** be exposed to the client
- ⚠️ Never commit `.env.local` to git
- ✅ Vercel automatically handles environment variable security

## Quick Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` OR `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Variables are enabled for Production, Preview, and Development
- [ ] Redeployed after setting variables
- [ ] Tested the deployed application
