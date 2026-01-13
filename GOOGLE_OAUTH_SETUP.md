# Google OAuth Setup Guide

This guide will help you set up Google OAuth login for your application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required information (App name, User support email, Developer contact)
   - Add scopes: `email`, `profile`
   - Add test users if needed
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: Your app name (e.g., "TotallyNormal Store")
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-domain.com` (for production)
   - Authorized redirect URIs:
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for development)
7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to enable it
   - **Important**: Make sure the toggle switch is ON (enabled)
   - If you see "Unsupported provider: provider is not enabled" error, this means Google is not enabled
5. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**
7. **Verify**: The Google provider should show as "Enabled" with a green checkmark

## Step 3: Configure Redirect URLs

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Add your site URLs:
   - **Site URL**: `http://localhost:3000` (development) or `https://your-domain.com` (production)
   - **Redirect URLs**: 
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Go to the login page
3. Click **Continue with Google**
4. You should be redirected to Google's sign-in page
5. After signing in, you'll be redirected back to your app

## Troubleshooting

### "Redirect URI mismatch" error
- Make sure the redirect URI in Google Cloud Console matches exactly: `https://your-project-id.supabase.co/auth/v1/callback`
- Check that your Supabase project URL is correct

### "OAuth client not found" error
- Verify your Client ID and Client Secret are correct in Supabase
- Make sure Google OAuth is enabled in Supabase

### "Unsupported provider: provider is not enabled" error
- **This is the most common issue**: Google OAuth is not enabled in Supabase
- Go to Supabase Dashboard → Authentication → Providers
- Find Google and make sure the toggle switch is ON (enabled)
- If disabled, click to enable it and save your credentials
- Refresh your app and try again

### User not created in database
- Check the browser console for errors
- Verify the callback route (`/auth/callback`) is working
- Check Supabase logs for any database errors

## Notes

- First-time Google users will automatically be created in the `users` table with role "user"
- Username is generated from email (e.g., `john.doe@gmail.com` → `johndoe`)
- If username already exists, a number is appended (e.g., `johndoe1`, `johndoe2`)
- Users can still use regular username/password login alongside Google OAuth
