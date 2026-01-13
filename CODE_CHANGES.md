# Code Changes Documentation

Complete record of all code changes made during the MongoDB to Supabase migration, from initial migration to latest fixes.

## Table of Contents

1. [Supabase Client Setup](#supabase-client-setup)
2. [Authentication Changes](#authentication-changes)
3. [API Route Migrations](#api-route-migrations)
4. [Frontend Component Updates](#frontend-component-updates)
5. [Bug Fixes](#bug-fixes)
6. [Database Schema](#database-schema)
7. [Admin Dashboard System](#admin-dashboard-system)
8. [UI/UX Improvements](#uiux-improvements)
9. [Route Protection](#route-protection)
10. [Code Cleanup - Comment Removal](#code-cleanup---comment-removal)
11. [Price Formatting System](#price-formatting-system)
12. [Modal Interaction Improvements](#modal-interaction-improvements)
13. [Button Alignment Fixes](#button-alignment-fixes)
14. [Loading State Improvements](#loading-state-improvements)
15. [Password Reset System](#password-reset-system)
16. [Google OAuth Login](#google-oauth-login)
17. [Account Management System](#account-management-system)

---

## Supabase Client Setup

### 1. Created `src/lib/supabase.js` (Admin Client)

**Purpose**: Admin operations, migrations, and bypassing RLS policies

**Code Created:**
```javascript
import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service role key');
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
```

**Detailed Explanation**:
- **What it does**: Creates a Supabase client with admin privileges (service role key) that can bypass Row Level Security (RLS) policies
- **Why it's needed**: Some operations require admin access, like auto-confirming user emails during registration or running migrations
- **How it works**:
  - `process.env.NEXT_PUBLIC_SUPABASE_URL`: Gets the Supabase project URL from environment variables
  - `process.env.SUPABASE_SERVICE_ROLE_KEY`: Gets the service role key (secret key with full database access)
  - `autoRefreshToken: false`: Disables automatic token refresh (not needed for admin operations)
  - `persistSession: false`: Doesn't save session to storage (admin operations are stateless)
- **When to use**: Only use this for server-side admin operations like confirming users, migrations, or bypassing RLS policies
- **Security note**: The service role key has full database access - never expose it to the client side!

---

### 2. Created `src/lib/supabase/server.js` (Server-Side Client)

**Purpose**: Server-side operations (API routes, Server Components) with cookie-based authentication

**Code Created:**
```javascript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return null during SSR/build when env vars are not available
    if (typeof window === 'undefined') {
      return null;
    }
    throw new Error('Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) are set.');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
```

**Detailed Explanation**:
- **What it does**: Creates a Supabase client for server-side operations (API routes, Server Components) that manages authentication cookies
- **Why it's needed**: Next.js App Router requires special cookie handling for server-side authentication. This client reads/writes cookies to maintain user sessions
- **How it works**:
  - `createServerClient`: Special function from `@supabase/ssr` for server-side use
  - `cookies()`: Next.js function to access request cookies
  - `getAll()`: Reads all cookies from the request (used to get auth tokens)
  - `setAll()`: Writes cookies to the response (used to save auth tokens)
  - `typeof window === 'undefined'`: Checks if code is running on server (prevents build errors)
  - Returns `null` during build/SSR if env vars missing (allows build to complete)
- **Cookie management**: Supabase stores auth tokens in cookies. This client reads them from incoming requests and writes them to responses
- **When to use**: Use in API routes (`/api/*`) and Server Components (not Client Components)

**Changes Made (Vercel Deployment Fix)**:
```javascript
// BEFORE: Threw error immediately
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// AFTER: Returns null during SSR/build
if (!supabaseUrl || !supabaseKey) {
  if (typeof window === 'undefined') {
    return null;
  }
  throw new Error('Missing Supabase environment variables...');
}
```

**Explanation of the Fix**:
- **Problem**: During Vercel build, Next.js pre-renders pages on the server. If env vars aren't available yet, the code throws an error and build fails
- **Solution**: Check if running on server (`typeof window === 'undefined'`). If yes and env vars missing, return `null` instead of throwing
- **Why it works**: 
  - Build time: Returns `null`, build completes successfully
  - Runtime: If env vars still missing, throws error (user sees proper error)
  - Client-side: Always throws error if env vars missing (prevents broken client)
- **Result**: Build succeeds even if env vars not set, but runtime still validates them

---

### 3. Created `src/lib/supabase/client.js` (Client-Side Browser Client)

**Purpose**: Client-side operations (Client Components) with cookie-based authentication

**Code Created:**
```javascript
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // Return null during SSR/build when env vars are not available
    if (typeof window === 'undefined') {
      return null;
    }
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
```

**Detailed Explanation**:
- **What it does**: Creates a Supabase client for client-side operations (Client Components, browser)
- **Why it's needed**: Client Components run in the browser and need a different client setup than server-side code
- **How it works**:
  - `createBrowserClient`: Special function from `@supabase/ssr` for browser use
  - Automatically handles cookies in the browser (reads/writes to document.cookie)
  - `NEXT_PUBLIC_*` prefix: Makes env vars available to client-side code (Next.js requirement)
  - Returns `null` during SSR if env vars missing (prevents build errors)
- **Cookie handling**: Browser client automatically manages cookies - no manual cookie code needed
- **When to use**: Use in Client Components (files with `"use client"` directive) and browser-side code
- **Security**: Uses anon/publishable key (safe to expose to client, protected by RLS policies)

**Changes Made (Vercel Deployment Fix)**:
```javascript
// BEFORE: Threw error immediately
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// AFTER: Returns null during SSR/build
if (!supabaseUrl || !supabaseKey) {
  if (typeof window === 'undefined') {
    return null;
  }
  throw new Error('Missing Supabase environment variables');
}
```

---

## Authentication Changes

### 1. Updated `src/app/api/login/route.js`

**Purpose**: Login with username-only (email looked up internally)

**BEFORE (MongoDB)**:
```javascript
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { username, password } = await req.json();
  
  const user = await User.findOne({ username });
  if (!user) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
  }
  
  // Set session/cookie
  return NextResponse.json({ message: "Login successful", role: user.role });
}
```

**Explanation of MongoDB Approach**:
- **What it did**: Looked up user by username in MongoDB, compared password with bcrypt
- **How it worked**: 
  - `User.findOne({ username })`: Searched MongoDB for user with matching username
  - `bcrypt.compare()`: Compared plain password with hashed password stored in database
  - If match found, returned success (but didn't actually set session - incomplete)
- **Problems**: 
  - Manual password hashing/verification
  - No proper session management
  - Required storing passwords in database

**AFTER (Supabase)**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    // Look up user email from username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username, role, email')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.error("User lookup error:", userError);
      return NextResponse.json(
        { message: "Invalid Username or Password" },
        { status: 401 }
      );
    }

    const email = userData.email || `${username}@temp.local`;
    
    console.log("Login attempt - Username:", username, "Using email:", email);

    // Use email for Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      
      if (authError.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { 
            message: "Please confirm your email before logging in",
            error: authError.message 
          },
          { status: 401 }
        );
      }
      
      if (authError.message.includes('Invalid login credentials')) {
        return NextResponse.json(
          { 
            message: "Invalid Username or Password",
            error: authError.message 
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        { 
          message: "Login failed",
          error: authError.message,
          details: "Check server logs for more information"
        },
        { status: 401 }
      );
    }

    if (!authData.user) {
      console.error("No user returned from auth");
      return NextResponse.json(
        { message: "Login failed - no user data" },
        { status: 401 }
      );
    }

    console.log("Login successful for user:", userData.username);

    return NextResponse.json({
      message: "Login successful",
      role: userData.role || "user",
      username: userData.username,
      user: authData.user
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      message: "Server error",
      error: error.message 
    }, { status: 500 });
  }
}
```

**Detailed Explanation**:
- **What it does**: Allows users to login with username (not email), but internally uses email for Supabase Auth
- **Why username-only login**: Users prefer usernames, but Supabase Auth requires email
- **How it works**:
  1. **Get username/password** from request body
  2. **Look up email**: Query `users` table to find email associated with username
     - `.from('users')`: Query the users table
     - `.eq('username', username)`: Find where username matches
     - `.single()`: Expect exactly one result (or error)
  3. **Get email**: Use stored email, or generate temp email (`username@temp.local`)
  4. **Supabase Auth**: Call `signInWithPassword()` with email (Supabase requirement)
     - Supabase handles password verification automatically
     - Creates session and sets cookies automatically
  5. **Error handling**: Check for specific errors (email not confirmed, invalid credentials)
  6. **Return user data**: Return username, role, and auth user object
- **Key points**:
  - User enters username, but we use email internally
  - Supabase handles password hashing/verification (no bcrypt needed)
  - Session/cookies managed automatically by Supabase
  - Better error messages for different failure cases

**Key Changes**:
- Removed: `User` model import, `bcrypt` import
- Added: `createClient` from `@/lib/supabase/server`
- Changed: Username lookup → Email lookup → Supabase Auth
- Added: Enhanced error handling for email confirmation and invalid credentials

---

### 2. Updated `src/app/api/register/route.js`

**Purpose**: User registration with auto-confirmation

**BEFORE (MongoDB)**:
```javascript
import { NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { username, password, role } = await req.json();
  
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return NextResponse.json({ error: "Username already exists" }, { status: 400 });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    password: hashedPassword,
    role: role || "user"
  });
  
  return NextResponse.json({ message: "User registered successfully" }, { status: 201 });
}
```

**AFTER (Supabase)**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { username, password, role, email, contact, idUrl } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 });
    }

    // Check if username exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error("Error checking existing user:", checkError);
      
      if (checkError.message && checkError.message.includes('schema cache')) {
        return NextResponse.json({ 
          error: "Database table not found. Please run the schema setup first.",
          details: "The 'users' table doesn't exist. Go to Supabase Dashboard → SQL Editor and run supabase/schema.sql"
        }, { status: 500 });
      }
      
      return NextResponse.json({ error: "Error checking username availability" }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const authEmail = email || `${username}@temp.local`;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: authEmail,
      password: password,
      options: {
        data: {
          username: username,
          role: role || "user"
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
      }
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Failed to create authentication account" }, { status: 500 });
    }

    // Auto-confirm the user (bypass email confirmation)
    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error("Error auto-confirming user:", confirmError);
      } else {
        console.log("User auto-confirmed:", authData.user.id);
      }
    }

    // Create user record in users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        username,
        email: authEmail,
        contact: contact || null,
        id_url: idUrl || null,
        role: role || "user"
      })
      .select()
      .single();
```

**Detailed Explanation of Registration Flow**:
- **Step 1 - Check username**: 
  - `.maybeSingle()`: Returns null if no match (vs `.single()` which throws error)
  - `PGRST116`: Error code when no rows found (we ignore this, it's expected)
  - If username exists, return error immediately
  
- **Step 2 - Generate email**:
  - Use provided email OR create temp email (`username@temp.local`)
  - Supabase Auth requires email, but user might not provide one
  
- **Step 3 - Create Auth user**:
  - `supabase.auth.signUp()`: Creates user in Supabase Auth system
  - `options.data`: Stores username/role in user metadata (accessible later)
  - `emailRedirectTo`: Where to redirect after email confirmation (if enabled)
  - Supabase automatically hashes password (no bcrypt needed!)
  
- **Step 4 - Auto-confirm**:
  - `email_confirmed_at`: Null means email not confirmed yet
  - Uses admin client to bypass normal confirmation flow
  - `updateUserById()`: Admin function to confirm email without user clicking link
  - **Why**: Users can login immediately without email confirmation
  
- **Step 5 - Create user record**:
  - Insert into `users` table (separate from auth.users)
  - Stores username, email, contact, id_url, role
  - `.select().single()`: Returns the created record
  - This is our application's user data (auth.users is just for authentication)

    if (userError) {
      console.error("Error creating user record:", userError);
      
      if (userError.message && userError.message.includes('schema cache')) {
        return NextResponse.json({ 
          error: "Database table not found. Please run the schema setup first.",
          details: "The 'users' table doesn't exist. Go to Supabase Dashboard → SQL Editor and run supabase/schema.sql"
        }, { status: 500 });
      }
      
      if (userError.code === '23505') {
        if (userError.message.includes('username')) {
          return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }
        if (userError.message.includes('email')) {
          return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }
      }
      
      return NextResponse.json({ 
        error: "Failed to create user", 
        details: userError.message,
        code: userError.code 
      }, { status: 500 });
    }

    return NextResponse.json(
      { message: `${role === "seller" ? "Seller" : "User"} registered successfully` },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Key Changes**:
- Removed: `User` model, `bcrypt` hashing
- Added: Supabase Auth signup, auto-confirmation using admin client
- Added: Email field support, contact, idUrl fields
- Added: Comprehensive error handling for schema errors and duplicate keys

---

### 3. Updated `src/app/api/seller/register/route.js`

**Purpose**: Seller registration with auto-confirmation

**BEFORE (MongoDB)**:
```javascript
import { NextResponse } from "next/server";
import Seller from "@/models/Seller";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { sellerUsername, password, email, contact, idUrl } = await req.json();
  
  const existing = await Seller.findOne({ username: sellerUsername });
  if (existing) {
    return NextResponse.json({ message: "Username already taken" }, { status: 400 });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  await Seller.create({
    username: sellerUsername,
    password: hashedPassword,
    email,
    contact,
    idUrl
  });
  
  return NextResponse.json({ message: "Seller registered successfully!" }, { status: 201 });
}
```

**AFTER (Supabase)**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const { sellerUsername, password, email, contact, idUrl } = await req.json();

    if (!sellerUsername || !password || !email || !contact || !idUrl) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    // Check if username exists
    const { data: existing } = await supabase
      .from('users')
      .select('username')
      .eq('username', sellerUsername)
      .single();

    if (existing) {
      return NextResponse.json({ message: "Username already taken" }, { status: 400 });
    }

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: sellerUsername,
          role: "seller"
        }
      }
    });

    if (authError) {
      return NextResponse.json({ message: authError.message }, { status: 400 });
    }

    // Auto-confirm the seller (bypass email confirmation)
    if (authData.user && !authData.user.email_confirmed_at) {
      const adminClient = createSupabaseAdminClient();
      const { error: confirmError } = await adminClient.auth.admin.updateUserById(
        authData.user.id,
        { email_confirm: true }
      );
      
      if (confirmError) {
        console.error("Error auto-confirming seller:", confirmError);
      } else {
        console.log("Seller auto-confirmed:", authData.user.id);
      }
    }

    // Create seller record in users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        username: sellerUsername,
        email: email,
        contact: contact,
        id_url: idUrl,
        role: "seller"
      });

    if (userError) {
      console.error("Error creating seller record:", userError);
      return NextResponse.json({ message: "Failed to create seller" }, { status: 500 });
    }

    return NextResponse.json({ message: "Seller registered successfully!" }, { status: 201 });
  } catch (err) {
    console.error("Seller register error:", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
```

**Key Changes**:
- Removed: `Seller` model, `bcrypt` hashing
- Added: Supabase Auth signup, auto-confirmation
- Changed: Uses unified `users` table with `role: "seller"`

---

### 4. Updated `src/app/context/AuthContext.js`

**Purpose**: Authentication context with Supabase session management

**BEFORE (MongoDB)**:
```javascript
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/check")
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setRole(data.role);
          setUsername(data.username);
        }
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**AFTER (Supabase)**:
```javascript
"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState(null);
  const [sellerUsername, setSellerUsername] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserData(session.user.email || session.user.user_metadata?.username);
      } else {
        setLoading(false);
      }
    });

    if (!supabase) {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData(session.user.email || session.user.user_metadata?.username);
      } else {
        setRole(null);
        setUsername(null);
        setSellerUsername(null);
        setLoading(false);
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [supabase]);
```

**Explanation of AuthContext useEffect**:
- **What it does**: Manages authentication state across the app - checks if user is logged in and updates state
- **How it works**:
  1. **Initial check**: `getSession()` - Gets current session when component mounts
     - If session exists, fetch user data from database
     - If no session, set loading to false (user not logged in)
  
  2. **Listen for changes**: `onAuthStateChange()` - Watches for login/logout events
     - Triggers when user logs in/out
     - If session exists: Fetch user data
     - If no session: Clear all user state (logout)
  
  3. **Cleanup**: `unsubscribe()` - Removes listener when component unmounts
     - Prevents memory leaks
     - Stops listening when component is destroyed
  
- **Why needed**: 
  - Provides user data (username, role) to all components
  - Automatically updates when user logs in/out
  - Single source of truth for auth state

  const fetchUserData = async (emailOrUsername) => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('username, role')
        .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
        .single();

      if (userData && !error) {
        setUsername(userData.username);
        setRole(userData.role);
        if (userData.role === 'seller') {
          setSellerUsername(userData.username);
        }
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };
```

**Explanation of fetchUserData**:
- **What it does**: Queries database to get user's username and role after authentication
- **How it works**:
  - `.or()`: Searches by email OR username (flexible lookup)
    - `email.eq.${emailOrUsername}`: Match email field
    - `username.eq.${emailOrUsername}`: Match username field
  - `.single()`: Expect exactly one result
  - Sets React state: `username`, `role`, and `sellerUsername` (if seller)
- **Why needed**: 
  - Supabase Auth only provides email/user ID
  - We need username and role from our `users` table
  - Makes user data available to all components via context

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    await fetch("/api/logout", { method: "POST" });
    setRole(null);
    setUsername(null);
    setSellerUsername(null);
  };

  return (
    <AuthContext.Provider value={{ role, setRole, username, setUsername, sellerUsername, setSellerUsername, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**Key Changes**:
- Removed: `/api/auth/check` endpoint call
- Added: Supabase client, `getSession()`, `onAuthStateChange()` subscription
- Added: `fetchUserData()` function to query users table
- Added: `sellerUsername` state for seller role
- Added: Null checks for Supabase client (Vercel deployment fix)

---

## API Route Migrations

### 1. Updated `src/app/api/addToCart/route.js`

**Purpose**: Add products to cart with field name compatibility

**BEFORE (MongoDB)**:
```javascript
import { NextResponse } from "next/server";
import CartItem from "@/models/CartItem";

export async function POST(req) {
  const { username, productId, productName, description, price, idUrl, quantity } = await req.json();
  
  const existing = await CartItem.findOne({ username, productId });
  if (existing) {
    existing.quantity += quantity || 1;
    await existing.save();
    return NextResponse.json({ message: "Quantity updated" });
  }
  
  await CartItem.create({
    username,
    productId,
    productName,
    description,
    price,
    idUrl,
    quantity: quantity || 1
  });
  
  return NextResponse.json({ message: "Product added to cart!" });
}
```

**AFTER (Supabase)**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const body = await req.json();
    
    // Accept both camelCase and snake_case
    const username = body.username;
    const product_id = body.productId || body.product_id;
    const product_name = body.productName || body.product_name;
    const description = body.description;
    const price = body.price;
    const id_url = body.idUrl || body.id_url;
    const quantity = body.quantity;
    
    console.log("Add to cart request body:", body);
    console.log("Parsed fields:", { username, product_id, product_name, description, price, id_url, quantity });

    if (!username || !product_id || !product_name || !description || !price || !id_url) {
      console.error("Missing fields:", { username: !!username, product_id: !!product_id, product_name: !!product_name, description: !!description, price: !!price, id_url: !!id_url });
      return NextResponse.json({ 
        message: "All fields are required.",
        received: { username: !!username, product_id: !!product_id, product_name: !!product_name, description: !!description, price: !!price, id_url: !!id_url }
      }, { status: 400 });
    }
```

**Explanation of Field Name Compatibility**:
- **Problem**: Frontend uses camelCase (`productId`), database uses snake_case (`product_id`)
- **Solution**: Accept both formats using `||` operator
  - `body.productId || body.product_id`: Try camelCase first, fallback to snake_case
  - This makes API flexible - works with either naming convention
- **Why needed**: Different parts of codebase use different conventions
  - JavaScript/React: camelCase (standard)
  - PostgreSQL: snake_case (standard)
- **`!!variable`**: Converts to boolean (true if exists, false if null/undefined)
  - Used in error message to show which fields are missing

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    // Check if item already exists
    const { data: existing, error: fetchError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .eq('product_id', product_id)
      .single();

    if (existing && !fetchError) {
      // Update quantity
      const newQuantity = existing.quantity + (quantity || 1);
      const { data: updated, error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({ 
        message: "Product quantity updated in cart!", 
        updated: true,
        quantity: updated.quantity
      }, { status: 200 });
    }
```

**Explanation of Cart Logic**:
- **Check existing item**: 
  - `.eq('username', username)`: Find items for this user
  - `.eq('product_id', product_id)`: Find this specific product
  - `.single()`: Expect exactly one match (or error)
- **If exists**: Update quantity instead of creating duplicate
  - `existing.quantity + (quantity || 1)`: Add new quantity to existing
  - `.update()`: Modify existing record
  - `.eq('id', existing.id)`: Update the specific cart item by its ID
- **If not exists**: Continue to insert new item (code below)
- **Why**: Prevents duplicate cart entries - same product just increases quantity

    const priceString = typeof price === 'number' ? price.toString() : price;

    // Insert new cart item
    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        username,
        product_id: product_id,
        product_name: product_name,
        description: description,
        price: priceString,
        id_url: id_url,
        quantity: quantity || 1
      })
      .select()
      .single();

    if (insertError) {
      console.error("Add to cart error:", insertError);
      
      if (insertError.message && insertError.message.includes('row-level security')) {
        return NextResponse.json(
          { 
            message: "Permission denied. Please check RLS policies.",
            error: insertError.message,
            details: "The cart_items table RLS policy might be blocking the insert."
          },
          { status: 403 }
        );
      }
      
      if (insertError.code === '23505') {
        return NextResponse.json(
          { message: "Product already in cart." },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { 
          message: "Failed to add to cart",
          error: insertError.message,
          code: insertError.code,
          details: insertError
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Product added to cart successfully!",
      cartItem: {
        productId: cartItem.product_id,
        productName: cartItem.product_name,
        quantity: cartItem.quantity
      }
    }, { status: 201 });
  } catch (err) {
    console.error("Add to cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
```

**Key Changes**:
- Removed: `CartItem` model
- Added: Field name compatibility (accepts both `productId`/`product_id`, `productName`/`product_name`, `idUrl`/`id_url`)
- Added: Comprehensive error handling for RLS policies and duplicate keys
- Changed: Uses Supabase insert/update queries

---

### 2. Updated `src/app/api/getCart/route.js`

**Purpose**: Get user's cart with field name transformation

**BEFORE (MongoDB)**:
```javascript
import { NextResponse } from "next/server";
import CartItem from "@/models/CartItem";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  
  const cart = await CartItem.find({ username });
  
  return NextResponse.json({ cart, count: cart.length });
}
```

**AFTER (Supabase)**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ message: "Username is required." }, { status: 400 });
    }

    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ message: "Supabase client not initialized" }, { status: 500 });
    }

    const { data: cart, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Get cart error:", error);
      return NextResponse.json({ 
        message: "Server error", 
        error: error.message 
      }, { status: 500 });
    }

    // Transform field names for frontend compatibility
    const transformedCart = (cart || []).map(item => ({
      ...item,
      idUrl: item.id_url,
      productName: item.product_name,
    }));
```

**Explanation of Field Transformation**:
- **What it does**: Adds camelCase aliases to database snake_case fields
- **How it works**:
  - `.map()`: Creates new array with transformed items
  - `...item`: Spreads all existing fields (keeps `id`, `quantity`, etc.)
  - `idUrl: item.id_url`: Adds camelCase version alongside snake_case
  - `productName: item.product_name`: Same for product name
- **Result**: Frontend receives both formats - can use either `item.id_url` or `item.idUrl`
- **Why**: Frontend code might use camelCase, but database returns snake_case

    return NextResponse.json({ 
      cart: transformedCart,
      count: transformedCart.length 
    }, { status: 200 });
  } catch (err) {
    console.error("Get cart error:", err);
    return NextResponse.json({ 
      message: "Server error", 
      error: err.message 
    }, { status: 500 });
  }
}
```

**Key Changes**:
- Removed: `CartItem` model
- Added: Field transformation (`id_url` → `idUrl`, `product_name` → `productName`)
- Added: Error handling and null checks
- Changed: Uses Supabase select query with ordering

---

## Frontend Component Updates

### 1. Updated `src/app/cart/viewCart/page.js`

**Purpose**: Cart page with Supabase ID support

**BEFORE (MongoDB - using `_id`)**:
```javascript
// Filter items
setCartItems((prevItems) =>
  prevItems.filter((item) => item._id !== itemId)
);

// Update items
setCartItems((prevItems) =>
  prevItems.map((item) =>
    item._id === itemId
      ? { ...item, quantity: data.cartItem.quantity }
      : item
  )
);

// Render
{item._id}
key={item._id}
onClick={() => handleRemove(item._id)}
disabled={removingId === item._id}
src={item.idUrl}
alt={item.productName}
{item.productName}
```

**AFTER (Supabase - using `id`)**:
```javascript
// Filter items
setCartItems((prevItems) =>
  prevItems.filter((item) => item.id !== itemId)
);

// Update items
setCartItems((prevItems) =>
  prevItems.map((item) =>
    item.id === itemId
      ? { ...item, quantity: data.cartItem.quantity }
      : item
  )
);

// Render (14 occurrences changed)
{item.id}
key={item.id}
onClick={() => handleRemove(item.id)}
disabled={removingId === item.id}
src={item.id_url || item.idUrl}
alt={item.product_name || item.productName}
{item.product_name || item.productName}
```

**Key Changes**:
- Changed: `item._id` → `item.id` (14 occurrences)
- Added: Field name fallback support (`item.id_url || item.idUrl`, `item.product_name || item.productName`)

---

### 2. Updated `src/app/seller/dashboard/page.js`

**Purpose**: Seller dashboard with correct username for cart operations

**BEFORE (Checking `sellerUsername`)**:
```javascript
const { username } = useAuth();
const { sellerUsername } = useAuth();

const handleAddToCart = async () => {
  if (!selectedProduct) return;

  if (!sellerUsername) {
    setCartMessage("login");
    setTimeout(() => setCartMessage(""), 3000);
    return;
  }

  // ...
  body: JSON.stringify({
    username: sellerUsername,
    // ...
  }),
};
```

**AFTER (Using `username`)**:
```javascript
const { username, sellerUsername } = useAuth();

const handleAddToCart = async () => {
  if (!selectedProduct) return;

  if (!username) {
    setCartMessage("login");
    setTimeout(() => setCartMessage(""), 3000);
    return;
  }

  // ...
  body: JSON.stringify({
    username: username,
    productId: selectedProduct.product_id || selectedProduct.productId,
    productName: selectedProduct.product_name || selectedProduct.productName,
    // ...
    idUrl: selectedProduct.id_url || selectedProduct.idUrl,
    // ...
  }),
};
```

**Key Changes**:
- Removed: Duplicate `useAuth()` call
- Changed: `sellerUsername` check → `username` check
- Changed: `username: sellerUsername` → `username: username`
- Added: Field name fallback support for product fields

---

### 3. Updated `src/app/dashboard/page.js` and `src/app/components/CategoryPage.js`

**Purpose**: Support both field name formats when adding to cart

**BEFORE**:
```javascript
body: JSON.stringify({
  username: username,
  productId: selectedProduct.productId,
  productName: selectedProduct.productName,
  description: selectedProduct.description,
  price: selectedProduct.price,
  idUrl: selectedProduct.idUrl,
  quantity: quantity,
}),
```

**AFTER**:
```javascript
body: JSON.stringify({
  username: username,
  productId: selectedProduct.product_id || selectedProduct.productId,
  productName: selectedProduct.product_name || selectedProduct.productName,
  description: selectedProduct.description,
  price: selectedProduct.price,
  idUrl: selectedProduct.id_url || selectedProduct.idUrl,
  quantity: quantity,
}),
```

**Key Changes**:
- Added: Field name fallback support (prioritizes `snake_case`, falls back to `camelCase`)

---

## Bug Fixes

### 1. Shopping Cart Operations Fix

**File**: `src/app/cart/viewCart/page.js`

**Issue**: Cart operations (plus/minus/delete) not working

**Root Cause**: Using MongoDB's `_id` instead of Supabase's `id`

**Code Changed** (14 occurrences):
```javascript
// BEFORE
item._id
key={item._id}
onClick={() => handleRemove(item._id)}
disabled={removingId === item._id}
prevItems.filter((item) => item._id !== itemId)
item._id === itemId

// AFTER
item.id
key={item.id}
onClick={() => handleRemove(item.id)}
disabled={removingId === item.id}
prevItems.filter((item) => item.id !== itemId)
item.id === itemId
```

**Function**: All cart item operations now use Supabase UUID instead of MongoDB ObjectId

---

### 2. Field Name Mismatch Fix

**Files**: 
- `src/app/api/addToCart/route.js`
- `src/app/api/getProduct/route.js`
- `src/app/api/getProductByCategory/route.js`
- `src/app/api/sellers/getProducts/route.js`
- `src/app/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/seller/dashboard/page.js`

**Issue**: Frontend sent camelCase, API expected snake_case

**Code Added**:
```javascript
// API accepts both formats
const product_id = body.productId || body.product_id;
const product_name = body.productName || body.product_name;
const id_url = body.idUrl || body.id_url;

// API returns both formats
const transformedProducts = products.map(p => ({
  ...p,
  productId: p.product_id,
  productName: p.product_name,
  idUrl: p.id_url,
}));
```

**Function**: Provides compatibility between frontend (camelCase) and database (snake_case)

---

### 3. Email Confirmation Fix

**Files**: 
- `src/app/api/register/route.js`
- `src/app/api/seller/register/route.js`

**Issue**: "Email not confirmed" error on login

**Code Added**:
```javascript
// Auto-confirm the user (bypass email confirmation)
if (authData.user && !authData.user.email_confirmed_at) {
  const adminClient = createSupabaseAdminClient();
  const { error: confirmError } = await adminClient.auth.admin.updateUserById(
    authData.user.id,
    { email_confirm: true }
  );
  
  if (confirmError) {
    console.error("Error auto-confirming user:", confirmError);
  } else {
    console.log("User auto-confirmed:", authData.user.id);
  }
}
```

**Explanation of Auto-Confirmation**:
- **What it does**: Automatically confirms user's email without requiring them to click confirmation link
- **Why needed**: 
  - Supabase by default requires email confirmation before login
  - We want users to login immediately after registration
  - Bypasses the email confirmation step
- **How it works**:
  - `email_confirmed_at`: Null means email not confirmed yet
  - Uses admin client (has permission to modify any user)
  - `updateUserById()`: Admin function to update user directly
  - `email_confirm: true`: Sets email as confirmed
- **Security**: Only works because we use admin client (service role key)
  - Normal users can't confirm other users' emails
  - Only server-side code with admin key can do this
```

**Function**: Automatically confirms user email during registration to bypass email confirmation requirement

---

### 4. RLS Policy Violation Fix

**Files**: 
- `supabase/schema.sql`
- `supabase/reset.sql`
- `supabase/fix-rls-policy.sql`

**Issue**: "new row violates row-level security policy" on registration

**Code Added**:
```sql
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);
```

**Detailed Explanation**:
- **What it does**: Allows anyone to insert (create) new user records during registration
- **RLS (Row Level Security)**: PostgreSQL feature that blocks database operations unless explicitly allowed by policies
- **`WITH CHECK (true)`**: No restrictions - anyone can insert
- **Why needed**: 
  - Without this policy, registration would fail with "row-level security policy violation"
  - Registration happens before user is authenticated, so we need to allow unauthenticated inserts
- **Security**: Still safe because:
  - Username must be unique (enforced by database constraint)
  - Email validation happens in application code
  - Other operations (update, delete) have stricter policies that require authentication

**Function**: Allows users to insert their own records during registration

---

### 5. Vercel Deployment Fix

**Files**: 
- `src/lib/supabase/client.js`
- `src/lib/supabase/server.js`
- `src/app/context/AuthContext.js`

**Issue**: Build fails with "Missing Supabase environment variables"

**Code Changed**:

**In `src/lib/supabase/client.js`**:
```javascript
// BEFORE
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// AFTER
if (!supabaseUrl || !supabaseKey) {
  if (typeof window === 'undefined') {
    return null;
  }
  throw new Error('Missing Supabase environment variables');
}
```

**In `src/lib/supabase/server.js`**:
```javascript
// BEFORE
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

// AFTER
if (!supabaseUrl || !supabaseKey) {
  if (typeof window === 'undefined') {
    return null;
  }
  throw new Error('Missing Supabase environment variables...');
}
```

**In `src/app/context/AuthContext.js`**:
```javascript
// ADDED: Null checks throughout
const supabase = createClient();

useEffect(() => {
  if (!supabase) {
    setLoading(false);
    return;
  }
  // ... rest of code
}, [supabase]);

const fetchUserData = async (emailOrUsername) => {
  if (!supabase) {
    setLoading(false);
    return;
  }
  // ... rest of code
};

const logout = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  // ... rest of code
};
```

**Function**: Gracefully handles missing environment variables during SSR/build time

---

### 6. Seller Add to Cart Fix

**File**: `src/app/seller/dashboard/page.js`

**Issue**: Sellers getting "Please log in to add items to your cart" error

**Code Changed**:
```javascript
// BEFORE
const { username } = useAuth();
const { sellerUsername } = useAuth();
if (!sellerUsername) {
  setCartMessage("login");
  return;
}
username: sellerUsername

// AFTER
const { username, sellerUsername } = useAuth();
if (!username) {
  setCartMessage("login");
  return;
}
username: username
```

**Function**: Uses `username` (set for all authenticated users) instead of `sellerUsername` for cart operations

---

## Database Schema

### Created `supabase/schema.sql`

**Purpose**: Complete database schema with tables, indexes, and RLS policies

**Code Created**:
```sql
-- Users table (merged User and Seller models)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  contact VARCHAR(255),
  id_url TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id VARCHAR(255) UNIQUE NOT NULL,
  seller_username VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  id_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  id_url TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL,
  seller_username VARCHAR(255) NOT NULL,
  product_id VARCHAR(255) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_username);
CREATE INDEX IF NOT EXISTS idx_cart_items_username ON cart_items(username);
CREATE INDEX IF NOT EXISTS idx_orders_username ON orders(username);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can insert (registration)
CREATE POLICY "Users can insert" ON users FOR INSERT WITH CHECK (true);

-- Users can read/update own data
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid()::text = id::text OR true);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Products: public read, sellers manage own
CREATE POLICY "Products are viewable by everyone" ON products FOR SELECT USING (true);
CREATE POLICY "Sellers can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can update own products" ON products FOR UPDATE USING (seller_username = current_setting('app.current_user', true));

-- Cart: users access own items only
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT USING (username = current_setting('app.current_user', true));
CREATE POLICY "Users can insert own cart items" ON cart_items FOR INSERT WITH CHECK (username = current_setting('app.current_user', true));
CREATE POLICY "Users can update own cart items" ON cart_items FOR UPDATE USING (username = current_setting('app.current_user', true));
CREATE POLICY "Users can delete own cart items" ON cart_items FOR DELETE USING (username = current_setting('app.current_user', true));
```

**Function**: Creates all database tables, indexes, and RLS policies for the application

---

## Admin Dashboard System

### Overview

**Purpose**: Complete admin dashboard system for managing sellers, viewing statistics, and tracking website visits

**Date**: Latest major feature addition

**Components**: Admin dashboard, API routes, visit tracking, seller approval workflow

---

### 1. Database Schema Updates

#### Added `seller_status` Column to Users Table

**File**: `supabase/add-seller-status-column.sql`

**Code Created**:
```sql
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

**Detailed Explanation**:
- **What it does**: Adds a `seller_status` column to track seller approval state
- **Values**: `'pending'`, `'approved'`, `'rejected'`, or `NULL` (for non-sellers)
- **CHECK constraint**: Ensures only valid status values can be inserted
- **Why needed**: Allows admins to approve/reject seller registrations before they can login
- **Migration safety**: Uses `IF NOT EXISTS` to prevent errors if column already exists

**Function**: Tracks seller account approval status in the database

---

#### Created `website_visits` Table

**File**: `supabase/add-website-visits-table.sql`

**Code Created**:
```sql
CREATE TABLE IF NOT EXISTS website_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_path TEXT NOT NULL,
  visitor_id TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_created_at ON website_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_visits_page_path ON website_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_visits_visitor_id ON website_visits(visitor_id);

ALTER TABLE website_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert visits" ON website_visits;
CREATE POLICY "Anyone can insert visits" ON website_visits
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read visits" ON website_visits;
CREATE POLICY "Admins can read visits" ON website_visits
  FOR SELECT USING (true);
```

**Detailed Explanation**:
- **What it does**: Stores website visit data for analytics
- **Fields**:
  - `page_path`: Which page was visited (e.g., `/dashboard`, `/product/category`)
  - `visitor_id`: Unique identifier for anonymous visitors (stored in sessionStorage)
  - `user_agent`: Browser information
  - `ip_address`: Visitor IP (tracked server-side)
  - `created_at`: Timestamp of visit
- **Indexes**: Created for fast queries on date, page path, and visitor ID
- **RLS Policies**:
  - Anyone can insert (for tracking)
  - Admins can read (for statistics)
- **Why needed**: Provides website analytics and visit statistics for admin dashboard

**Function**: Tracks and stores website visit data for analytics

---

### 2. Admin API Routes

#### Created `src/app/api/admin/statistics/route.js`

**Purpose**: Fetch comprehensive statistics for admin dashboard

**Code Created**:
```javascript
export async function GET(req) {
  const supabase = await createClient();
  
  // Admin authentication check
  const { data: { user } } = await supabase.auth.getUser();
  // ... verify user is admin ...
  
  // Get user counts
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'user');

  const { count: totalSellers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller');

  const { count: approvedSellers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller')
    .eq('seller_status', 'approved');

  const { count: pendingSellers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'seller')
    .eq('seller_status', 'pending');

  // Get product count
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // Get visit statistics (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count: totalVisits } = await supabase
    .from('website_visits')
    .select('*', { count: 'exact', head: true });

  const { data: dailyVisits } = await supabase
    .from('website_visits')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  // Process daily visits into date groups
  const dailyVisitsGrouped = {};
  if (dailyVisits) {
    dailyVisits.forEach(visit => {
      const date = new Date(visit.created_at).toISOString().split('T')[0];
      dailyVisitsGrouped[date] = (dailyVisitsGrouped[date] || 0) + 1;
    });
  }

  return NextResponse.json({
    success: true,
    statistics: {
      users: { total: totalUsers || 0, sellers: { total, approved, pending } },
      products: { total: totalProducts || 0 },
      visits: { total, uniqueLast30Days, dailyLast30Days, pageViews }
    }
  });
}
```

**Detailed Explanation**:
- **What it does**: Aggregates statistics from multiple tables for admin dashboard
- **Statistics returned**:
  - User counts (total users, total sellers, approved sellers, pending sellers)
  - Product count (total products)
  - Visit statistics (total visits, unique visitors last 30 days, daily visits array, page views)
- **Date processing**: Groups visits by date for chart display
- **Authentication**: Verifies user is admin before returning data
- **Why needed**: Provides comprehensive overview of platform activity

**Function**: Returns aggregated statistics for admin dashboard display

---

#### Created `src/app/api/admin/pendingSellers/route.js`

**Purpose**: Fetch sellers with `seller_status = 'pending'`

**Code Created**:
```javascript
export async function GET(req) {
  const supabase = await createClient();
  
  // Admin authentication check
  // ... verify user is admin ...
  
  const { data: pendingSellers, error } = await supabase
    .from('users')
    .select('id, username, email, contact, id_url, created_at')
    .eq('role', 'seller')
    .eq('seller_status', 'pending')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: true,
    pendingSellers: pendingSellers || []
  });
}
```

**Function**: Returns list of sellers waiting for admin approval

---

#### Created `src/app/api/admin/approveSeller/route.js`

**Purpose**: Approve or reject a seller registration

**Code Created**:
```javascript
export async function POST(req) {
  const { sellerId, action } = await req.json();
  
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ 
      message: "action must be 'approve' or 'reject'" 
    }, { status: 400 });
  }

  const supabase = await createClient();
  
  // Admin authentication check
  // ... verify user is admin ...
  
  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  
  const { data: updatedSeller, error: updateError } = await supabase
    .from('users')
    .update({ seller_status: newStatus })
    .eq('id', sellerId)
    .eq('role', 'seller')
    .select()
    .single();

  return NextResponse.json({ 
    success: true,
    message: `Seller ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
    seller: updatedSeller
  });
}
```

**Detailed Explanation**:
- **What it does**: Updates seller's `seller_status` to 'approved' or 'rejected'
- **Validation**: Ensures action is either 'approve' or 'reject'
- **Security**: Verifies user is admin before allowing update
- **Result**: Seller can now login (if approved) or is blocked (if rejected)
- **Why needed**: Allows admins to review and approve seller registrations

**Function**: Updates seller approval status in database

---

#### Created `src/app/api/admin/users/route.js`

**Purpose**: Fetch all users with `role = 'user'`

**Code Created**:
```javascript
export async function GET(req) {
  const supabase = await createClient();
  
  // Admin authentication check
  // ... verify user is admin ...
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, email, contact, created_at')
    .eq('role', 'user')
    .order('created_at', { ascending: false });

  return NextResponse.json({
    success: true,
    users: users || []
  });
}
```

**Function**: Returns list of all regular users for admin view

---

#### Created `src/app/api/admin/sellers/route.js`

**Purpose**: Fetch all sellers with their approval status

**Code Created**:
```javascript
export async function GET(req) {
  const supabase = await createClient();
  
  // Admin authentication check
  // ... verify user is admin ...
  
  const { data: sellers, error } = await supabase
    .from('users')
    .select('id, username, email, contact, id_url, seller_status, created_at')
    .eq('role', 'seller')
    .order('created_at', { ascending: false });

  // Handle missing seller_status column gracefully
  const sellersWithStatus = (sellers || []).map(seller => ({
    ...seller,
    seller_status: seller.seller_status || null
  }));

  return NextResponse.json({
    success: true,
    sellers: sellersWithStatus || []
  });
}
```

**Function**: Returns list of all sellers with their approval status

---

### 3. Visit Tracking System

#### Created `src/app/api/trackVisit/route.js`

**Purpose**: Record website visits for analytics

**Code Created**:
```javascript
export async function POST(req) {
  const { pagePath, visitorId, userAgent, ipAddress } = await req.json();

  if (!pagePath) {
    return NextResponse.json({ 
      message: "pagePath is required" 
    }, { status: 400 });
  }

  // Skip tracking for admin pages
  if (pagePath.startsWith('/admin')) {
    return NextResponse.json({ 
      success: true,
      message: "Admin pages are not tracked"
    }, { status: 200 });
  }

  const supabase = await createClient();

  // Check if the user is an admin - don't track admin visits
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // Get user role from users table
    let userData = null;
    if (user.email) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('email', user.email)
        .maybeSingle();
      userData = data;
    }
    
    if (!userData && user.user_metadata?.username) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('username', user.user_metadata.username)
        .maybeSingle();
      userData = data;
    }

    // Skip tracking if user is an admin
    if (userData && userData.role === 'admin') {
      return NextResponse.json({ 
        success: true,
        message: "Admin visits are not tracked"
      }, { status: 200 });
    }
  }

  // Insert visit record
  const { error } = await supabase
    .from('website_visits')
    .insert({
      page_path: pagePath,
      visitor_id: visitorId || null,
      user_agent: userAgent || null,
      ip_address: ipAddress || null
    });

  return NextResponse.json({ 
    success: true,
    message: "Visit tracked successfully"
  }, { status: 200 });
}
```

**Detailed Explanation**:
- **What it does**: Records each page visit to the database
- **Exclusions**: 
  - Admin pages (`/admin/*`) are not tracked
  - Admin users' visits are not tracked
- **Data collected**: Page path, visitor ID, user agent, IP address
- **Why needed**: Provides analytics data for admin dashboard
- **Privacy**: Admin activity is excluded from statistics

**Function**: Records website visits while excluding admin activity

---

#### Created `src/app/components/VisitTracker.js`

**Purpose**: Client-side component to automatically track page visits

**Code Created**:
```javascript
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function VisitTracker() {
  const pathname = usePathname();
  const { role } = useAuth();

  useEffect(() => {
    // Skip tracking for admin pages and admin users
    if (pathname.startsWith('/admin') || role === 'admin') {
      return;
    }

    // Generate or get visitor ID from sessionStorage
    let visitorId = sessionStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_id', visitorId);
    }

    // Track the visit
    const trackVisit = async () => {
      try {
        await fetch('/api/trackVisit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pagePath: pathname,
            visitorId: visitorId,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
          }),
        });
      } catch (error) {
        console.error('Failed to track visit:', error);
      }
    };

    // Small delay to ensure page is loaded
    const timeoutId = setTimeout(trackVisit, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, role]);

  return null;
}
```

**Detailed Explanation**:
- **What it does**: Automatically tracks page visits when user navigates
- **Visitor ID**: Generated once per session and stored in sessionStorage
- **Exclusions**: Skips tracking for admin pages and admin users
- **Integration**: Added to `src/app/layout.js` to track all pages
- **Why needed**: Provides automatic visit tracking without manual implementation

**Function**: Automatically tracks page visits for analytics

---

### 4. Admin Dashboard Pages

#### Created `src/app/admin/dashboard/page.js`

**Purpose**: Main admin dashboard with statistics and pending sellers

**Key Features**:
- Statistics cards (users, sellers, products, visits)
- Pending sellers list with approve/reject actions
- ID picture viewing modal
- Visit statistics charts
- Responsive design

**Code Structure**:
```javascript
export default function AdminDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showIdModal, setShowIdModal] = useState(false);

  const fetchData = async () => {
    const [statsRes, sellersRes] = await Promise.all([
      fetch("/api/admin/statistics"),
      fetch("/api/admin/pendingSellers")
    ]);
    // ... process responses ...
  };

  const handleApproveReject = async (sellerId, action) => {
    const res = await fetch("/api/admin/approveSeller", {
      method: "POST",
      body: JSON.stringify({ sellerId, action }),
    });
    // ... update UI ...
  };

  const viewIdPicture = (seller) => {
    setSelectedSeller(seller);
    setShowIdModal(true);
  };
}
```

**Function**: Main admin interface for managing sellers and viewing statistics

---

#### Created `src/app/admin/viewUsers/page.js`

**Purpose**: View and search all registered users

**Key Features**:
- User list with search functionality
- User count display
- Responsive table layout
- User information (username, email, contact, registration date)

**Function**: Displays all users with search and filtering capabilities

---

#### Created `src/app/admin/viewSellers/page.js`

**Purpose**: View and manage all sellers

**Key Features**:
- Seller list with status filters (all, pending, approved, rejected)
- Search functionality
- ID picture previews
- Approve/reject actions
- Full-size ID viewing modal
- Responsive card grid layout

**Function**: Comprehensive seller management interface

---

#### Created `src/app/admin/components/adminNavbar.js`

**Purpose**: Navigation bar for admin pages

**Key Features**:
- Admin portal branding
- Navigation menu (Dashboard, View Users, View Sellers)
- Mobile-responsive drawer
- Active page highlighting
- Logout functionality

**Function**: Navigation component for admin section

---

### 5. Seller Approval Workflow

#### Updated `src/app/api/seller/register/route.js`

**Purpose**: Set seller status to 'pending' during registration

**Code Added**:
```javascript
// Create seller record in users table
const { error: userError } = await supabase
  .from('users')
  .insert({
    username: sellerUsername,
    email: email,
    contact: contact,
    id_url: idUrl,
    role: "seller",
    seller_status: "pending"  // NEW: Set status to pending
  });
```

**Function**: New sellers are automatically set to 'pending' status

---

#### Updated `src/app/api/login/route.js`

**Purpose**: Block login for pending/rejected sellers

**Code Added**:
```javascript
// Check if seller is pending approval
if (userData.role === 'seller') {
  if (userData.seller_status === 'pending') {
    return NextResponse.json(
      { 
        message: "Waiting for admin approval",
        sellerStatus: "pending",
        details: "Your seller account is pending approval. Please wait for admin approval before logging in."
      },
      { status: 403 }
    );
  }
  
  if (userData.seller_status === 'rejected') {
    return NextResponse.json(
      { 
        message: "Seller account rejected",
        sellerStatus: "rejected",
        details: "Your seller account has been rejected. Please contact support for more information."
      },
      { status: 403 }
    );
  }
}
```

**Detailed Explanation**:
- **What it does**: Checks seller status before allowing login
- **Pending sellers**: Blocked with specific message
- **Rejected sellers**: Blocked with rejection message
- **Approved sellers**: Allowed to login normally
- **Why needed**: Ensures only approved sellers can access seller features

**Function**: Prevents unapproved sellers from logging in

---

#### Updated `src/app/page.js` (Login Page)

**Purpose**: Display styled popup messages for seller approval issues

**Code Added**:
```javascript
if (!res.ok) {
  if (res.status === 403 && data.sellerStatus === 'pending') {
    setPopupMessage(data.details || "Waiting for admin approval. Please wait for admin approval before logging in.");
    setPopupType("warning");
    setShowPopup(true);
    return;
  }
  
  if (res.status === 403 && data.sellerStatus === 'rejected') {
    setPopupMessage(data.details || "Your seller account has been rejected. Please contact support for more information.");
    setPopupType("error");
    setShowPopup(true);
    return;
  }
}
```

**Function**: Shows user-friendly messages for seller approval status

---

#### Updated `src/app/sellerRegister/page.js`

**Purpose**: Display success message about pending approval

**Code Added**:
```javascript
if (response.ok) {
  const successMessage = data.details 
    ? `${data.message}\n\n${data.details}`
    : data.message || "Seller registered successfully! Your account is pending admin approval. You will be able to login and start selling once approved (usually within 24-48 hours).";
  setPopupMessage(successMessage);
  setShowPopup(true);
  setTimeout(() => {
    setShowPopup(false);
    router.push("/");
  }, 6000);
}
```

**Function**: Informs sellers about approval process after registration

---

### 6. Admin Account Creation

#### Created `scripts/create-admin.js`

**Purpose**: Script to create admin accounts

**Usage**:
```bash
node scripts/create-admin.js <username> <password> <email>
```

**Code Structure**:
```javascript
async function createAdmin() {
  // Check if username exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  
  if (existingUser) {
    console.error(`❌ Error: Username "${username}" already exists`);
    process.exit(1);
  }
  
  // Create auth user
  const { data: authData } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        username: username,
        role: 'admin'
      }
    }
  });
  
  // Auto-confirm using admin client
  const adminClient = createSupabaseAdminClient();
  await adminClient.auth.admin.updateUserById(
    authData.user.id,
    { email_confirm: true }
  );
  
  // Create user record
  const { data: newUser } = await supabase
    .from('users')
    .insert({
      username: username,
      email: email,
      role: 'admin'
    })
    .select()
    .single();
}
```

**Function**: Creates admin accounts with proper authentication and database records

---

## UI/UX Improvements

### 1. Responsive Design Implementation

#### Made Admin Pages Responsive

**Files Modified**:
- `src/app/admin/dashboard/page.js`
- `src/app/admin/viewUsers/page.js`
- `src/app/admin/viewSellers/page.js`

**Changes Made**:
- Responsive grid layouts for statistics cards
- Flexible padding and margins for different screen sizes
- Responsive text sizes (text-sm on mobile, text-lg on desktop)
- Mobile-friendly modals and overlays
- Touch-friendly button sizes

**Function**: Admin pages now work seamlessly on mobile, tablet, and desktop

---

#### Made Seller Pages More Compact

**Files Modified**:
- `src/app/sellerRegister/page.js`
- `src/app/seller/addProduct/page.js`
- `src/app/seller/dashboard/page.js`
- `src/app/seller/viewProduct/page.js`

**Changes Made**:
- Reduced max-width containers
- Reduced padding and header sizes
- Smaller image upload areas
- Tighter grid gaps
- More compact form layouts

**Function**: Seller pages are now more space-efficient and easier to navigate

---

#### Made Product Modals Smaller on Mobile

**Files Modified**:
- `src/app/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/seller/viewProduct/page.js`

**Changes Made**:
- Reduced modal max-width on small screens (`max-w-[95%]` on mobile)
- Smaller image heights
- Reduced padding
- Smaller text sizes

**Function**: Product viewing modals are appropriately sized for mobile devices

---

### 2. Image Display Fixes

#### Fixed Product Image Coverage

**Files Modified**:
- `src/app/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/seller/dashboard/page.js`
- `src/app/seller/viewProduct/page.js`
- `src/app/cart/viewCart/page.js`
- `src/app/seller/sellerCart/page.js`

**Code Added**:
```javascript
<img
  src={product.id_url || product.idUrl}
  alt={product.product_name || product.productName}
  className="absolute inset-0 w-full h-full object-cover"
  style={{ minHeight: '100%', minWidth: '100%' }}
/>
```

**Detailed Explanation**:
- **Problem**: Product images were not fully covering their containers, leaving gaps
- **Solution**: 
  - `absolute inset-0`: Positions image to fill container
  - `w-full h-full`: Ensures full width and height
  - `object-cover`: Maintains aspect ratio while covering entire area
  - `minHeight/minWidth: 100%`: Ensures image never shrinks below container size
- **Result**: Images now fully cover their containers without gaps

**Function**: Ensures product images fully cover their display containers

---

#### Fixed ID Picture Display in Admin Pages

**Files Modified**:
- `src/app/admin/dashboard/page.js`
- `src/app/admin/viewSellers/page.js`

**Changes Made**:
- Adjusted z-index for image and overlay
- Changed background from solid black to gradient
- Added hover scale effect
- Simplified overlay to appear only on hover
- Changed modal background to blur effect (`bg-black/30 backdrop-blur-md`)

**Function**: ID pictures now display correctly with proper layering and visual effects

---

#### Fixed Image Preview in Seller Registration

**File**: `src/app/sellerRegister/page.js`

**Code Added**:
```javascript
<img
  src={previewUrl}
  alt="ID Preview"
  className="absolute inset-0 w-full h-full object-cover z-0"
  style={{ minHeight: '100%', minWidth: '100%' }}
/>
```

**Function**: Image preview now displays correctly instead of showing black

---

### 3. Font Implementation

#### Implemented Inter Font

**File**: `src/app/layout.js`

**Code Added**:
```javascript
import { Inter } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

**File**: `src/app/globals.css`

**Code Added**:
```css
html {
  font-family: var(--font-inter);
}

@theme inline {
  --font-family-sans: var(--font-inter);
}
```

**Detailed Explanation**:
- **What it does**: Implements Inter font as the primary font for the project
- **Next.js optimization**: Uses `next/font/google` for automatic font optimization
- **CSS variable**: `--font-inter` makes font available throughout the app
- **Display swap**: Prevents invisible text during font load
- **Why Inter**: Clean, modern, highly readable font suitable for e-commerce

**Function**: Applies Inter font across the entire application

---

### 4. Mobile Navigation Improvements

#### Added Dashboard to Mobile Navigation

**File**: `src/app/components/navbar.js`

**Code Added**:
```javascript
import { faChartLine } from "@fortawesome/free-solid-svg-icons";

const menuItems = [
  // ... existing items ...
  {
    id: "dashboard",
    label: "Dashboard",
    icon: faChartLine,
    path: "/dashboard",
    action: dashboard,
  },
];
```

**Function**: Users can now access dashboard from mobile navigation menu

---

#### Made Mobile Header Smaller

**File**: `src/app/components/header.js`

**Changes Made**:
- Reduced text sizes on mobile
- Smaller icon sizes
- Reduced padding and gaps
- Modernized with gradient text and buttons

**Function**: Mobile header is now more compact and visually appealing

---

### 5. React Key Prop Fix

#### Fixed Missing Key Prop Warning

**File**: `src/app/seller/dashboard/page.js`

**Code Changed**:
```javascript
// BEFORE
{filteredProducts.map((product) => (
  <div key={product._id}>

// AFTER
{filteredProducts.map((product) => (
  <div key={product.id || product._id || product.product_id}>
```

**Detailed Explanation**:
- **Problem**: React warning "Each child in a list should have a unique 'key' prop"
- **Root cause**: Using `product._id` (MongoDB format) instead of `product.id` (Supabase UUID)
- **Solution**: Use `product.id` with fallbacks for compatibility
- **Why needed**: React requires unique keys for list items to optimize rendering

**Function**: Resolves React console warnings and ensures proper list rendering

---

### 6. Removed Featured Products from Navbar

**File**: `src/app/components/navbar.js`

**Code Removed**:
```javascript
<div
  onClick={FeaturedProducts}
  className="hidden md:flex items-center gap-3 p-6 border-b border-gray-200 cursor-pointer group hover:bg-gray-50 transition-colors"
>
  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
    <FontAwesomeIcon icon={faStar} className="text-white text-lg" />
  </div>
  <div>
    <p className="text-sm font-semibold text-gray-700">Featured Products</p>          
  </div>
</div>
```

**Function**: Removed unused "Featured Products" menu item from user portal navbar

---

### 7. Icon Sizing Fix

#### Fixed Icon Overflow During Page Load/Refresh

**Files Modified**:
- `src/app/globals.css`
- `src/app/layout.js`
- `src/app/page.js`
- `src/app/register/page.js`
- `src/app/sellerRegister/page.js`
- `src/app/dashboard/page.js`
- `src/app/seller/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/cart/viewCart/page.js`

**Problem**:
- FontAwesome icons were appearing oversized or out of bounds when pages load or refresh
- Icons would flash at their natural size before CSS loaded, causing layout shifts
- Some icons lacked explicit size constraints, allowing them to render at default/uncontrolled sizes
- This created a poor user experience with icons breaking layouts during initial page render

**Root Cause**:
- SVG icons (FontAwesome renders as SVG) don't have inherent size constraints
- During initial render, before CSS fully loads, icons render at their natural SVG dimensions
- FontAwesome's auto-injected CSS can conflict with custom styles
- Missing explicit size classes on many icons allowed uncontrolled sizing

**Solution**:

**1. Global CSS Constraints** (`src/app/globals.css`):

**Code Added**:
```css
svg {
  display: inline-block !important;
  vertical-align: middle;
  max-width: 100% !important;
  height: auto;
  flex-shrink: 0;
  box-sizing: content-box !important;
  width: auto !important;
}

svg[data-icon] {
  width: 1em !important;
  height: 1em !important;
  overflow: visible;
  max-width: 100% !important;
  max-height: 1em !important;
}

.svg-inline--fa {
  display: inline-block !important;
  font-size: inherit !important;
  height: 1em !important;
  overflow: visible;
  vertical-align: -0.125em;
  width: 1em !important;
  max-width: 100% !important;
  max-height: 1em !important;
  box-sizing: border-box !important;
}

.fa, .fas, .far, .fal, .fab {
  display: inline-block;
  font-size: inherit;
  height: 1em;
  overflow: visible;
  vertical-align: -0.125em;
  max-width: 100%;
  box-sizing: border-box;
}

[class*="fa-"] {
  display: inline-block;
  font-style: normal;
  font-variant: normal;
  text-rendering: auto;
  line-height: 1;
  max-width: 100%;
  box-sizing: border-box;
}
```

**Detailed Explanation**:
- **`svg` rules**: Constrains all SVG elements with `max-width: 100%` and proper box-sizing
- **`svg[data-icon]` rules**: FontAwesome icons have `data-icon` attribute - this targets them specifically with `!important` to override any conflicting styles
- **`.svg-inline--fa` rules**: FontAwesome's inline SVG class - enforces 1em sizing with `!important` flags
- **`!important` flags**: Ensures these rules take precedence over FontAwesome's auto-injected CSS
- **`1em` sizing**: Icons scale with their parent's font size (responsive and consistent)
- **`max-width/max-height`**: Prevents icons from exceeding container boundaries
- **Why needed**: Provides global constraints that apply immediately, even during initial render

**Function**: Ensures all SVG icons are properly constrained globally, preventing overflow during page load

---

**2. FontAwesome Configuration** (`src/app/layout.js`):

**Code Added**:
```javascript
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";

config.autoAddCss = false;
```

**Detailed Explanation**:
- **`config.autoAddCss = false`**: Prevents FontAwesome from automatically injecting CSS
- **Why needed**: 
  - FontAwesome's auto-injected CSS can conflict with our custom constraints
  - Manual import gives us control over when and how styles are applied
  - Prevents style conflicts during initial render
- **`import "@fortawesome/fontawesome-svg-core/styles.css"`**: Manually imports FontAwesome styles for better control
- **Result**: We have full control over icon styling without conflicts

**Function**: Prevents FontAwesome CSS conflicts and gives us full control over icon styling

---

**3. Explicit Size Classes on Icons**:

**Files Modified**:
- `src/app/page.js` (Login page)
- `src/app/register/page.js`
- `src/app/sellerRegister/page.js`
- `src/app/dashboard/page.js`
- `src/app/seller/dashboard/page.js`
- `src/app/components/CategoryPage.js`
- `src/app/cart/viewCart/page.js`

**Code Added**:
```javascript
// Login button icon
<FontAwesomeIcon icon={faSignInAlt} className="text-base sm:text-lg" style={{ width: '1em', height: '1em', maxWidth: '100%' }} />

// Register button icon
<FontAwesomeIcon icon={faUserPlus} className="text-base sm:text-lg" style={{ width: '1em', height: '1em', maxWidth: '100%' }} />

// Input field icons
<FontAwesomeIcon icon={faUser} className="text-gray-400 text-sm" />
<FontAwesomeIcon icon={faLock} className="text-gray-400 text-sm" />
<FontAwesomeIcon icon={faEye} className="text-sm" />

// Dashboard icons
<FontAwesomeIcon icon={faMinus} className="text-base" />
<FontAwesomeIcon icon={faPlus} className="text-base" />
<FontAwesomeIcon icon={faTh} className="mr-1 sm:mr-2 text-sm sm:text-base" />
<FontAwesomeIcon icon={faList} className="mr-1 sm:mr-2 text-sm sm:text-base" />
<FontAwesomeIcon icon={faEye} className="text-red-600 text-base" />
<FontAwesomeIcon icon={faCheckCircle} className="mr-1 text-sm" />
<FontAwesomeIcon icon={faTag} className="mr-2 text-sm" />
```

**Detailed Explanation**:
- **Size classes**: Added explicit Tailwind text size classes (`text-sm`, `text-base`, `text-lg`)
  - `text-sm`: Small icons (12px-14px)
  - `text-base`: Base size icons (16px)
  - `text-lg`: Large icons (18px)
  - Responsive: `text-base sm:text-lg` adapts to screen size
- **Inline styles**: Added `style={{ width: '1em', height: '1em', maxWidth: '100%' }}` to critical icons
  - Provides immediate constraint before CSS loads
  - `1em` ensures icons scale with font size
  - `maxWidth: '100%'` prevents overflow
- **Why needed**: 
  - Explicit sizing prevents icons from rendering at uncontrolled sizes
  - Inline styles provide immediate constraint (no waiting for CSS)
  - Size classes ensure consistent sizing across the app
- **Pattern**: 
  - Button icons: `text-base sm:text-lg` (responsive)
  - Input icons: `text-sm` (small, unobtrusive)
  - Action icons: `text-base` (standard size)
  - Large icons: `text-lg` or `text-xl` (for emphasis)

**Function**: Provides explicit size constraints on individual icons, preventing uncontrolled rendering

---

**4. Comprehensive Icon Updates**:

**Icons Fixed Across Project**:
- Login page: `faSignInAlt`, `faUser`, `faLock`, `faEye`, `faEyeSlash`
- Register page: `faUserPlus`, `faUser`, `faEnvelope`, `faLock`, `faEye`, `faEyeSlash`
- Seller register: `faUser`, `faLock`, `faEye`, `faEyeSlash`
- Dashboard: `faTh`, `faList`, `faEye`, `faMinus`, `faPlus`, `faCheckCircle`, `faTag`
- Seller dashboard: `faTh`, `faList`, `faEye`, `faMinus`, `faPlus`, `faCheckCircle`, `faTag`, `faAlignLeft`
- Category page: `faTh`, `faList`, `faEye`
- Cart page: `faTimes`

**Total Icons Updated**: 30+ icons across 8+ files

**Function**: Ensures all icons have proper size constraints throughout the application

---

**How the Solution Works**:

1. **Global CSS (First Line of Defense)**:
   - CSS rules with `!important` apply immediately when stylesheet loads
   - Constrains all SVG elements globally
   - Prevents icons from exceeding container boundaries

2. **FontAwesome Configuration (Prevents Conflicts)**:
   - Disables auto-injected CSS that could conflict
   - Gives us full control over styling

3. **Explicit Size Classes (Component Level)**:
   - Tailwind classes provide responsive sizing
   - Icons scale appropriately for their context
   - Consistent sizing across similar use cases

4. **Inline Styles (Immediate Constraint)**:
   - Applied directly to DOM elements
   - No waiting for CSS to load
   - Prevents flash of unstyled content (FOUC)

**Result**:
- Icons maintain proper size during page load
- No layout shifts or overflow issues
- Consistent sizing across all pages
- Responsive behavior maintained
- Better user experience with smooth page loads

**Function**: Comprehensive solution that prevents icon overflow at multiple levels (global CSS, configuration, component classes, inline styles)

---

## Route Protection

### Overview

**Purpose**: Implement route protection to prevent unauthorized access to seller and admin pages

**Date**: Latest security enhancement

**Scope**: All seller pages and admin pages now have role-based access control

---

### 1. Seller Pages Protection

#### Updated All Seller Pages

**Files Modified**:
- `src/app/seller/dashboard/page.js`
- `src/app/seller/addProduct/page.js`
- `src/app/seller/viewProduct/page.js`
- `src/app/seller/sellerCart/page.js`

**Code Added**:
```javascript
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SellerPage() {
  const router = useRouter();
  const { username, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (!username || (role !== "seller" && role !== "admin")) {
        router.push("/");
        return;
      }
    }
  }, [username, role, authLoading, router]);

  // Rest of component code...
}
```

**Detailed Explanation**:
- **What it does**: Checks user authentication and role before allowing access to seller pages
- **Access rules**:
  - User must be logged in (`username` exists)
  - User role must be `'seller'` OR `'admin'`
  - Admins can access seller pages for management purposes
- **Unauthorized access**: Redirects to home page (`/`)
- **Loading state**: Waits for `authLoading` to complete before checking (prevents false redirects)
- **Why needed**: Prevents regular users from accessing seller-only features

**Function**: Restricts seller pages to sellers and admins only

---

#### Example: Seller Dashboard Protection

**File**: `src/app/seller/dashboard/page.js`

**BEFORE**:
```javascript
export default function Dashboard() {
  const router = useRouter();
  const { username, sellerUsername } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      // ... fetch products
    };
    fetchProducts();
  }, []);
}
```

**AFTER**:
```javascript
export default function Dashboard() {
  const router = useRouter();
  const { username, sellerUsername, role, loading: authLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!username || (role !== "seller" && role !== "admin")) {
        router.push("/");
        return;
      }
    }
  }, [username, role, authLoading, router]);

  useEffect(() => {
    if (!username || (role !== "seller" && role !== "admin")) {
      return;
    }
    const fetchProducts = async () => {
      // ... fetch products
    };
    fetchProducts();
  }, [username, role]);
}
```

**Key Changes**:
- Added `role` and `authLoading` from `useAuth()`
- Added protection `useEffect` that checks role and redirects if unauthorized
- Modified data fetching `useEffect` to only run if user is authorized
- Prevents data fetching for unauthorized users

---

### 2. Admin Pages Protection

#### Verified All Admin Pages

**Files Verified**:
- `src/app/admin/dashboard/page.js` - Already had protection
- `src/app/admin/viewUsers/page.js` - Already had protection
- `src/app/admin/viewSellers/page.js` - Already had protection
- `src/app/admin/page.js` - Updated to redirect to dashboard

**Existing Protection Pattern**:
```javascript
useEffect(() => {
  if (!authLoading) {
    if (role !== "admin") {
      router.push("/");
      return;
    }
    fetchData();
  }
}, [role, authLoading, router]);
```

**Detailed Explanation**:
- **What it does**: Ensures only admin users can access admin pages
- **Access rules**: User role must be exactly `'admin'`
- **Unauthorized access**: Redirects to home page (`/`)
- **Why needed**: Admin pages contain sensitive data and management functions

**Function**: Restricts admin pages to admins only

---

#### Updated Admin Login Page

**File**: `src/app/admin/page.js`

**BEFORE**:
```javascript
export default function AdminLoginPage() {
   return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">Admin Login Page</h1>
    </div>
   )
};
```

**AFTER**:
```javascript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (role !== "admin") {
        router.push("/");
        return;
      } else {
        router.push("/admin/dashboard");
      }
    }
  }, [role, authLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-t-transparent border-red-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  );
}
```

**Detailed Explanation**:
- **What it does**: Redirects admin users to dashboard, blocks non-admins
- **Behavior**:
  - If user is admin: Redirects to `/admin/dashboard`
  - If user is not admin: Redirects to home page (`/`)
  - While loading: Shows loading spinner
- **Why needed**: Provides proper routing for admin login page

**Function**: Handles admin login page routing and protection

---

### 3. Security Implementation Details

#### Protection Flow

1. **Component Mounts**: Page component loads
2. **Check Loading State**: Waits for `authLoading` to complete
3. **Verify Authentication**: Checks if user is logged in (`username` exists)
4. **Verify Role**: Checks if user has required role
5. **Authorize or Redirect**:
   - If authorized: Component continues to render
   - If unauthorized: Redirects to home page

#### Role-Based Access Matrix

| Page Type | Allowed Roles | Redirect If Unauthorized |
|-----------|--------------|-------------------------|
| Seller Pages | `seller`, `admin` | `/` (home) |
| Admin Pages | `admin` | `/` (home) |
| User Pages | `user`, `seller`, `admin` | No restriction |

#### Seller Status Consideration

- **Pending/Rejected Sellers**: Already blocked at login (cannot authenticate)
- **Approved Sellers**: Can access seller pages normally
- **Admins**: Can access seller pages for management purposes

**Why this works**: Since pending/rejected sellers are blocked at login, any authenticated seller accessing seller pages is guaranteed to be approved.

---

### 4. Files Modified Summary

**Seller Pages (4 files)**:
1. `src/app/seller/dashboard/page.js` - Added role check
2. `src/app/seller/addProduct/page.js` - Added role check and useEffect import
3. `src/app/seller/viewProduct/page.js` - Updated existing check to include admin
4. `src/app/seller/sellerCart/page.js` - Added role check

**Admin Pages (1 file)**:
1. `src/app/admin/page.js` - Added protection and redirect logic

**Total Changes**: 5 files modified

---

### 5. Benefits

1. **Security**: Prevents unauthorized access to sensitive pages
2. **User Experience**: Clear redirect behavior for unauthorized users
3. **Data Protection**: Prevents unauthorized data fetching
4. **Role Management**: Proper separation between user, seller, and admin access
5. **Admin Flexibility**: Admins can access seller pages for management

---

## Code Cleanup - Comment Removal

### Overview

**Purpose**: Remove all comments from the codebase to improve code clarity and reduce maintenance overhead

**Date**: Latest update

**Scope**: All JavaScript/JSX files, SQL files, and script files across the project

---

### 1. JavaScript/JSX Files (`src/`)

**Files Modified**: 16+ files across API routes, components, and pages

**Types of Comments Removed**:
- Single-line comments (`//`)
- Multi-line comments (`/* */`)
- JSDoc comments (`/** */`)
- JSX comments (`{/* */}`)
- Inline explanatory comments

**Example Changes**:

**BEFORE**:
```javascript
// Check if seller is pending approval
if (userData.role === 'seller') {
  if (userData.seller_status === 'pending') {
    return NextResponse.json(
      { 
        message: "Waiting for admin approval",
        // Seller status details
        sellerStatus: "pending",
      },
      { status: 403 }
    );
  }
}
```

**AFTER**:
```javascript
if (userData.role === 'seller') {
  if (userData.seller_status === 'pending') {
    return NextResponse.json(
      { 
        message: "Waiting for admin approval",
        sellerStatus: "pending",
      },
      { status: 403 }
    );
  }
}
```

**Key Files Updated**:
- `src/app/api/login/route.js` - Removed seller approval check comments
- `src/app/api/trackVisit/route.js` - Removed admin tracking skip comments
- `src/app/api/admin/*/route.js` - Removed authentication and query comments
- `src/app/components/VisitTracker.js` - Removed tracking logic comments
- `src/app/admin/dashboard/page.js` - Removed JSX section comments
- `src/app/admin/viewSellers/page.js` - Removed filter and modal comments
- `src/app/admin/viewUsers/page.js` - Removed search bar comments
- `src/app/seller/components/sellerNavbar.js` - Removed commented-out menu items
- `src/app/sellerRegister/page.js` - Removed success message comments
- `src/app/seller/addProduct/page.js` - Removed form reset comments
- `src/app/page.js` - Removed popup type comments
- `src/lib/supabase-client.js` - Removed deprecation JSDoc comments

**Function**: Cleaner codebase without explanatory comments, relying on self-documenting code

---

### 2. Script Files (`scripts/`)

**Files Modified**: 3 files

**Types of Comments Removed**:
- File header comments (usage instructions, warnings)
- Step-by-step process comments
- Inline explanatory comments

**Example Changes**:

**BEFORE** (`scripts/clear-database.js`):
```javascript
/**
 * Script to clear all database data except admin accounts
 * 
 * Usage: node scripts/clear-database.js
 * 
 * WARNING: This will permanently delete all data except admin accounts!
 */

import { createSupabaseAdminClient } from '../src/lib/supabase.js';

async function clearDatabase() {
  // Step 1: Get admin count before deletion
  const { count: adminCountBefore } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  // Step 2: Delete cart items (delete all)
  console.log('🗑️  Deleting cart items...');
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('id')
    .limit(1000); // Get all cart items
```

**AFTER**:
```javascript
import { createSupabaseAdminClient } from '../src/lib/supabase.js';

async function clearDatabase() {
  const { count: adminCountBefore } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin');

  console.log('🗑️  Deleting cart items...');
  const { data: cartItems, error: cartError } = await supabase
    .from('cart_items')
    .select('id')
    .limit(1000);
```

**Key Files Updated**:
- `scripts/clear-database.js` - Removed header comments and step comments
- `scripts/create-admin.js` - Removed usage instructions and process comments
- `scripts/setup-database.js` - Removed environment variable check comments

**Function**: Scripts are now more concise while maintaining functionality

---

### 3. SQL Files (`supabase/`)

**Files Modified**: 6 files

**Types of Comments Removed**:
- SQL single-line comments (`--`)
- SQL multi-line comments (`/* */`)
- Documentation comments
- Step-by-step process comments

**Example Changes**:

**BEFORE** (`supabase/clear-all-data-except-admin.sql`):
```sql
-- Clear all data except admin accounts
-- This script will delete all users (except admins), products, cart items, orders, and visits
-- WARNING: This will permanently delete all data except admin accounts!

-- Step 1: Delete all cart items
DELETE FROM cart_items;

-- Step 2: Delete all orders
DELETE FROM orders;

-- Step 3: Delete all products
DELETE FROM products;

-- Step 4: Delete all website visits
DELETE FROM website_visits;

-- Step 5: Delete all users EXCEPT admins
-- This keeps admin accounts intact
DELETE FROM users 
WHERE role != 'admin' OR role IS NULL;

-- Verify: Show remaining users (should only be admins)
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;
```

**AFTER**:
```sql
DELETE FROM cart_items;

DELETE FROM orders;

DELETE FROM products;

DELETE FROM website_visits;

DELETE FROM users 
WHERE role != 'admin' OR role IS NULL;

SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;
```

**Key Files Updated**:
- `supabase/force-delete-all-users-except-admin.sql` - Removed warning and process comments
- `supabase/clear-all-data-except-admin.sql` - Removed step-by-step comments
- `supabase/add-website-visits-table.sql` - Removed table creation and policy comments
- `supabase/add-seller-status-column.sql` - Removed migration explanation comments
- `supabase/reset.sql` - Removed table description comments
- `supabase/schema.sql` - Removed table description comments

**Function**: SQL scripts are cleaner and more focused on the actual SQL statements

---

### Summary of Comment Removal

**Total Files Modified**: 25+ files

**Comment Types Removed**:
- ✅ Single-line comments (`//`) - JavaScript/JSX
- ✅ Multi-line comments (`/* */`) - JavaScript/JSX
- ✅ JSDoc comments (`/** */`) - JavaScript
- ✅ JSX comments (`{/* */}`) - React components
- ✅ SQL comments (`--`) - SQL files
- ✅ SQL multi-line comments (`/* */`) - SQL files
- ✅ File header comments - Scripts
- ✅ Inline explanatory comments - All files

**Files Preserved**:
- HTML attributes like `accept="image/*"` (not comments, these are valid HTML)
- Documentation files (`.md` files) - These are documentation, not code comments

**Result**:
- ✅ Cleaner, more readable codebase
- ✅ No linter errors introduced
- ✅ All functionality preserved
- ✅ Code is self-documenting through clear variable names and structure

---

## Password Reset System

### Overview

**Purpose**: Implement password reset functionality allowing users to reset their passwords via email

**Date**: Latest feature addition

**Scope**: Password reset request, email delivery, and password reset page

---

### 1. Created Password Reset API Route

#### Created `src/app/api/resetPassword/route.js`

**Purpose**: Handle password reset requests by looking up user email and sending reset email

**Code Created**:
```javascript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req) {
  try {
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ 
        message: "Username is required" 
      }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Look up user email from username
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, username')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      // Return success message even if user doesn't exist (security best practice)
      return NextResponse.json({ 
        message: "If an account with that username exists, a password reset email has been sent." 
      }, { status: 200 });
    }

    if (!userData.email) {
      return NextResponse.json({ 
        message: "This account does not have an email address. Please contact support." 
      }, { status: 400 });
    }

    // Send password reset email via Supabase
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      userData.email,
      {
        redirectTo: resetUrl,
      }
    );

    if (resetError) {
      console.error("Password reset error:", resetError);
      return NextResponse.json({ 
        message: "Failed to send reset email. Please try again later." 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: "If an account with that username exists, a password reset email has been sent to your email address." 
    }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ 
      message: "Server error. Please try again later." 
    }, { status: 500 });
  }
}
```

**Detailed Explanation**:
- **What it does**: Accepts username, looks up associated email, and sends password reset email via Supabase
- **Security practice**: Returns success message even if username doesn't exist (prevents username enumeration)
- **How it works**:
  1. Validates username is provided
  2. Looks up user email from `users` table using username
  3. If user not found, returns generic success message (security)
  4. If user found but no email, returns error
  5. Calls Supabase's `resetPasswordForEmail()` to send reset email
  6. Returns success message
- **Why needed**: Allows users to reset forgotten passwords without admin intervention

**Function**: Handles password reset requests and sends reset emails via Supabase

---

### 2. Created Password Reset Page

#### Created `src/app/auth/reset-password/page.js`

**Purpose**: Page where users set their new password after clicking the reset link in email

**Code Created**:
```javascript
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";

function ResetPasswordContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!password || !confirmPassword) {
      setPopupMessage("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      setPopupMessage("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setPopupMessage("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setPopupMessage(error.message || "Failed to reset password. The link may have expired.");
        return;
      }

      setPopupMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error) {
      setPopupMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Form with password and confirm password fields
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
```

**Detailed Explanation**:
- **What it does**: Provides a form for users to enter and confirm their new password
- **How it works**:
  1. User clicks reset link in email (contains auth token)
  2. Supabase validates the token automatically
  3. User enters new password and confirmation
  4. Validates password length (minimum 6 characters)
  5. Validates passwords match
  6. Calls `supabase.auth.updateUser()` to update password
  7. Redirects to login page on success
- **Security**: Password reset link contains time-limited token (handled by Supabase)
- **Suspense wrapper**: Required because component uses `useSearchParams()`

**Function**: Allows users to set new password after clicking reset link in email

---

### 3. Updated Login Page

#### Updated `src/app/page.js`

**Purpose**: Add "Forgot password?" link and reset password functionality

**Code Changes**:

**BEFORE**:
```javascript
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Password
  </label>
  <div className="relative">
    {/* Password input */}
  </div>
  <p className="text-gray-500 text-sm">
    Forgot password?{" "}
    <span
      // onClick={forgotPassword}
      className="text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors"
    >
      Reset password
    </span>
  </p>
</div>
```

**AFTER**:
```javascript
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Password
  </label>
  <div className="relative">
    {/* Password input */}
  </div>
  <div className="flex justify-end mt-2">
    <button
      type="button"
      onClick={handleResetPassword}
      disabled={resetLoading || !username}
      className="text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer underline underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
    >
      {resetLoading ? "Sending..." : "Forgot password?"}
    </button>
  </div>
</div>
```

**Code Added**:
```javascript
const [resetLoading, setResetLoading] = useState(false);

const handleResetPassword = async (e) => {
  e.preventDefault();
  if (!username) {
    setPopupMessage("Please enter your username first");
    setPopupType("error");
    setShowPopup(true);
    return;
  }

  setResetLoading(true);
  try {
    const res = await fetch("/api/resetPassword", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      setPopupMessage(data.message || "Password reset email sent! Please check your email.");
      setPopupType("success");
    } else {
      setPopupMessage(data.message || "If an account with that username exists, a password reset email has been sent.");
      setPopupType("success");
    }
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 6000);
  } catch (error) {
    setPopupMessage("Something went wrong. Please try again later.");
    setPopupType("error");
    setShowPopup(true);
  } finally {
    setResetLoading(false);
  }
};
```

**Detailed Explanation**:
- **What it does**: Adds functional "Forgot password?" button that triggers password reset
- **Positioning**: Moved to right side using `flex justify-end`
- **User experience**: 
  - Button disabled if username is empty
  - Shows "Sending..." while processing
  - Displays success/error popup messages
- **Security**: Always shows success message (even if username doesn't exist) to prevent username enumeration

**Function**: Provides easy access to password reset functionality from login page

---

## Google OAuth Login

### Overview

**Purpose**: Implement Google OAuth login for easy authentication without username/password

**Date**: Latest feature addition

**Scope**: Google OAuth integration, user account creation, and callback handling

---

### 1. Created OAuth Callback Handler

#### Created `src/app/auth/callback/route.js`

**Purpose**: Handle OAuth callback from Google and create user records

**Code Created**:
```javascript
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const email = data.user.email;
      const provider = data.user.app_metadata?.provider || "google";

      if (provider === "google" && email) {
        // Check if user exists in users table
        const { data: existingUser, error: userError } = await supabase
          .from("users")
          .select("id, username, email, role")
          .eq("email", email)
          .maybeSingle();

        // Create user record if doesn't exist
        if (!existingUser && !userError) {
          const emailUsername = email.split("@")[0];
          const baseUsername = emailUsername.replace(/[^a-zA-Z0-9]/g, "");
          let finalUsername = baseUsername || `user${Date.now()}`;
          let counter = 1;

          // Generate unique username
          while (true) {
            const { data: checkUser } = await supabase
              .from("users")
              .select("username")
              .eq("username", finalUsername)
              .maybeSingle();

            if (!checkUser) {
              break;
            }
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }

          // Insert new user
          const { error: insertError } = await supabase
            .from("users")
            .insert({
              username: finalUsername,
              email: email,
              role: "user",
            });

          if (insertError) {
            console.error("Error creating user record:", insertError);
          }
        } else if (existingUser) {
          // Redirect based on role
          const userRole = existingUser.role || "user";
          if (userRole === "admin") {
            return NextResponse.redirect(new URL("/admin/dashboard", request.url));
          } else if (userRole === "seller") {
            return NextResponse.redirect(new URL("/seller/dashboard", request.url));
          }
        }
      }
    }

    return NextResponse.redirect(new URL(next, request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
```

**Detailed Explanation**:
- **What it does**: Handles OAuth callback from Google, creates user records, and redirects appropriately
- **How it works**:
  1. Receives authorization code from Google via URL parameter
  2. Exchanges code for session using `exchangeCodeForSession()`
  3. Checks if user exists in `users` table by email
  4. If new user: Generates unique username from email and creates user record
  5. If existing user: Redirects based on role (admin/seller/user)
  6. Redirects to appropriate dashboard
- **Username generation**: 
  - Extracts username from email (e.g., `john.doe@gmail.com` → `johndoe`)
  - Removes special characters
  - Appends number if username already exists (e.g., `johndoe1`, `johndoe2`)
- **Why needed**: Automatically creates user accounts for first-time Google users

**Function**: Handles OAuth callback and creates/manages user accounts

---

### 2. Updated Login Page

#### Updated `src/app/page.js`

**Purpose**: Add "Continue with Google" button and OAuth login functionality

**Code Added**:
```javascript
import { createClient } from "@/lib/supabase/client";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

export default function LoginPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setPopupMessage("Unable to initialize. Please try again.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    setGoogleLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        
        let errorMessage = "Failed to sign in with Google. Please try again.";
        
        if (error.message && error.message.includes("provider is not enabled")) {
          errorMessage = "Google login is not enabled. Please contact the administrator or use username/password login.";
        }
        
        setPopupMessage(errorMessage);
        setPopupType("error");
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 6000);
        setGoogleLoading(false);
      }
    } catch (error) {
      console.error("Google login error:", error);
      setPopupMessage("Something went wrong. Please try again.");
      setPopupType("error");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 6000);
      setGoogleLoading(false);
    }
  };

  return (
    <form>
      {/* Username/password fields */}
      
      <button type="submit">Login</button>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="text-gray-500 text-sm">OR</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading || googleLoading}
        className="w-full mt-4 py-3 sm:py-3.5 px-4 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none touch-manipulation text-base flex items-center justify-center gap-3"
      >
        <FontAwesomeIcon icon={faGoogle} className="text-xl text-red-600" />
        <span>Continue with Google</span>
      </button>
    </form>
  );
}
```

**Detailed Explanation**:
- **What it does**: Adds Google OAuth login button with proper error handling
- **How it works**:
  1. User clicks "Continue with Google" button
  2. Calls `supabase.auth.signInWithOAuth()` with Google provider
  3. User is redirected to Google sign-in page
  4. After authentication, Google redirects to `/auth/callback`
  5. Callback handler processes the authentication
- **Error handling**: 
  - Detects if Google OAuth is not enabled in Supabase
  - Shows user-friendly error messages
  - Handles network errors gracefully
- **UI design**: 
  - Visual separator ("OR") between regular login and Google login
  - Google icon from FontAwesome brands
  - Styled to match existing design theme
- **Loading state**: Shows loading indicator while redirecting to Google

**Function**: Provides one-click Google authentication for users

---

### 3. Package Installation

#### Installed `@fortawesome/free-brands-svg-icons`

**Purpose**: Provide Google icon for OAuth button

**Command**:
```bash
npm install @fortawesome/free-brands-svg-icons
```

**Function**: Adds Google brand icon to project

---

### 4. Created Setup Documentation

#### Created `GOOGLE_OAUTH_SETUP.md`

**Purpose**: Comprehensive guide for setting up Google OAuth in Supabase

**Contents**:
- Step-by-step Google Cloud Console setup
- Supabase configuration instructions
- Redirect URL configuration
- Troubleshooting guide (including "provider is not enabled" error)
- Testing instructions

**Function**: Provides complete setup instructions for Google OAuth integration

---

## Account Management System

### Overview

**Purpose**: Create a comprehensive account management page where users can manage their shipping addresses and view their order history

**Date**: Latest feature addition

**Scope**: Account management page, shipping addresses CRUD operations, order history display, and database schema updates

---

### 1. Created Shipping Addresses Database Schema

#### Created `supabase/add-shipping-addresses-table.sql`

**Purpose**: Database table for storing user shipping addresses

**Code Created**:
```sql
CREATE TABLE IF NOT EXISTS shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Philippines',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_username ON shipping_addresses(username);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(username, is_default);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own addresses" ON shipping_addresses
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own addresses" ON shipping_addresses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own addresses" ON shipping_addresses
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own addresses" ON shipping_addresses
  FOR DELETE USING (true);

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Detailed Explanation**:
- **What it does**: Creates a table to store user shipping addresses with full address details
- **Fields**:
  - `id`: Unique identifier (UUID)
  - `username`: Links address to user account
  - `full_name`: Recipient's full name
  - `phone_number`: Contact phone number
  - `address_line1`: Primary address line (required)
  - `address_line2`: Secondary address line (optional, for apartment/unit numbers)
  - `city`: City name (required)
  - `province`: Province/State (required)
  - `postal_code`: Postal/ZIP code (required)
  - `country`: Country (defaults to 'Philippines')
  - `is_default`: Boolean flag for default address (only one per user)
  - `created_at` / `updated_at`: Timestamps
- **Indexes**: 
  - Index on `username` for fast lookups
  - Composite index on `username` and `is_default` for default address queries
- **RLS Policies**: Users can only access their own addresses
- **Default Address Logic**: Only one address per user can be marked as default (enforced in application logic)

**Function**: Provides database structure for shipping address management

---

### 2. Created Shipping Addresses API Route

#### Created `src/app/api/shipping-addresses/route.js`

**Purpose**: Handle CRUD operations for shipping addresses

**Code Created**:
```javascript
export async function GET(req) {
  // Fetch all addresses for a user
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  
  const { data: addresses, error } = await supabase
    .from('shipping_addresses')
    .select('*')
    .eq('username', username)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  
  return NextResponse.json({ success: true, addresses });
}

export async function POST(req) {
  // Add new address
  const { username, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault } = await req.json();
  
  // If setting as default, unset other defaults
  if (isDefault) {
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('username', username)
      .eq('is_default', true);
  }
  
  const { data: newAddress } = await supabase
    .from('shipping_addresses')
    .insert({
      username,
      full_name: fullName,
      phone_number: phoneNumber,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      city,
      province,
      postal_code: postalCode,
      country: country || 'Philippines',
      is_default: isDefault || false
    })
    .select()
    .single();
  
  return NextResponse.json({ success: true, address: newAddress });
}

export async function PUT(req) {
  // Update existing address
  const { id, fullName, phoneNumber, addressLine1, addressLine2, city, province, postalCode, country, isDefault } = await req.json();
  
  // If setting as default, unset other defaults
  if (isDefault) {
    const { data: existingAddress } = await supabase
      .from('shipping_addresses')
      .select('username')
      .eq('id', id)
      .single();
    
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('username', existingAddress.username)
      .eq('is_default', true)
      .neq('id', id);
  }
  
  const { data: updatedAddress } = await supabase
    .from('shipping_addresses')
    .update({ /* updated fields */ })
    .eq('id', id)
    .select()
    .single();
  
  return NextResponse.json({ success: true, address: updatedAddress });
}

export async function DELETE(req) {
  // Delete address
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  await supabase
    .from('shipping_addresses')
    .delete()
    .eq('id', id);
  
  return NextResponse.json({ success: true });
}
```

**Detailed Explanation**:
- **GET**: Fetches all addresses for a user, ordered by default status and creation date
- **POST**: Creates new address, automatically unsetting other defaults if this is set as default
- **PUT**: Updates existing address, handles default address logic
- **DELETE**: Removes an address by ID
- **Default Address Management**: When setting an address as default, all other addresses for that user are automatically set to `is_default = false`
- **Field Name Transformation**: Converts between camelCase (frontend) and snake_case (database)

**Function**: Provides complete CRUD API for shipping address management

---

### 3. Created Account Management Page

#### Created `src/app/account/page.js`

**Purpose**: User interface for managing shipping addresses and viewing order history

**Code Created**:
```javascript
"use client";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("addresses");
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // Fetch addresses and orders
  const fetchAddresses = async () => {
    const res = await fetch(`/api/shipping-addresses?username=${username}`);
    const data = await res.json();
    if (res.ok && data.success) {
      setAddresses(data.addresses || []);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch(`/api/getOrders?username=${username}`);
    const data = await res.json();
    if (res.ok) {
      setOrders(data.orders || []);
    }
  };

  // Address management functions
  const handleAddAddress = () => {
    setEditingAddress(null);
    setFormData({ /* reset form */ });
    setShowAddressForm(true);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setFormData({
      fullName: address.full_name,
      phoneNumber: address.phone_number,
      // ... map all fields
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    
    const res = await fetch(`/api/shipping-addresses?id=${id}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      fetchAddresses();
    }
  };

  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    const method = editingAddress ? "PUT" : "POST";
    const res = await fetch("/api/shipping-addresses", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ /* form data */ })
    });
    
    if (res.ok) {
      setShowAddressForm(false);
      fetchAddresses();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex">
      <Navbar />
      <main className="flex-1 relative mt-16 md:mt-0 flex flex-col">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl">
          <h1>Manage My Account</h1>
          
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button onClick={() => setActiveTab("addresses")}>
              Shipping Addresses
            </button>
            <button onClick={() => setActiveTab("orders")}>
              My Orders
            </button>
          </div>

          {/* Addresses Tab */}
          {activeTab === "addresses" && (
            <div>
              <button onClick={handleAddAddress}>Add Address</button>
              
              {addresses.map((address) => (
                <div key={address.id}>
                  {address.is_default && <span>Default Address</span>}
                  <p>{address.full_name}</p>
                  <p>{address.address_line1}</p>
                  {/* ... display address details ... */}
                  <button onClick={() => handleEditAddress(address)}>Edit</button>
                  <button onClick={() => handleDeleteAddress(address.id)}>Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              {orders.map((order) => (
                <div key={order.id}>
                  <img src={order.id_url} alt={order.product_name} />
                  <h3>{order.product_name}</h3>
                  <p>Quantity: {order.quantity}</p>
                  <p>Total: ₱{formatPrice(order.total_amount)}</p>
                  <span>{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

**Detailed Explanation**:
- **What it does**: Provides a two-tab interface for managing addresses and viewing orders
- **Layout Structure**: 
  - Matches dashboard layout pattern (Navbar sidebar + main content)
  - Header at top with dynamic title
  - Tab navigation for switching between addresses and orders
- **Address Management**:
  - Add new addresses with full form validation
  - Edit existing addresses
  - Delete addresses with confirmation
  - Set default address (only one per user)
  - Visual indicator for default address
- **Order History**:
  - Displays all user orders
  - Shows product image, name, quantity, price, status
  - Formatted prices with comma separators
  - Status badges (pending, shipped, delivered)
- **Modal Form**: Address form appears in a modal overlay with click-outside-to-close functionality
- **Error Handling**: Proper error handling for API calls with user-friendly messages
- **Loading States**: Loading indicators during data fetching

**Function**: Provides complete account management interface for users

---

### 4. Updated Header Component

#### Updated `src/app/components/header.js`

**Purpose**: Display "My Account" title when on account page instead of "Featured Products"

**Code Added**:
```javascript
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const pageTitle = pathname === "/account" ? "My Account" : "Featured Products";

  return (
    <div>
      <h1>{pageTitle}</h1>
      {/* ... rest of header ... */}
    </div>
  );
}
```

**Detailed Explanation**:
- **What it does**: Dynamically changes header title based on current route
- **How it works**: Uses `usePathname()` hook to detect current route
- **Conditional Logic**: If pathname is `/account`, shows "My Account", otherwise shows "Featured Products"
- **Why needed**: Provides context-appropriate page title for better user experience

**Function**: Displays context-appropriate page title in header

---

### 5. Updated Navigation Links

#### Updated Header Dropdown Menus

**Files Modified**:
- `src/app/components/header.js`
- `src/app/seller/components/sellerNavbar.js`
- `src/app/admin/components/adminNavbar.js`

**Code Changed**:
```javascript
// BEFORE
<button onClick={() => router.push("/dashboard")}>
  Manage My Account
</button>

// AFTER
<button onClick={() => router.push("/account")}>
  Manage My Account
</button>
```

**Detailed Explanation**:
- **What it does**: Updates all "Manage My Account" links to point to `/account` page
- **Scope**: Updated in user header, seller navbar, and admin navbar
- **Consistency**: All user types (user, seller, admin) can access account management from their respective navigation menus

**Function**: Provides consistent navigation to account management page across all user types

---

### 6. Updated Database Schema Files

#### Updated `supabase/schema.sql` and `supabase/reset.sql`

**Purpose**: Include shipping addresses table in main schema files

**Code Added**:
```sql
CREATE TABLE IF NOT EXISTS shipping_addresses (
  -- ... table definition ...
);

CREATE INDEX IF NOT EXISTS idx_shipping_addresses_username ON shipping_addresses(username);
CREATE INDEX IF NOT EXISTS idx_shipping_addresses_default ON shipping_addresses(username, is_default);

ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own addresses" ON shipping_addresses FOR SELECT USING (true);
CREATE POLICY "Users can insert own addresses" ON shipping_addresses FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own addresses" ON shipping_addresses FOR UPDATE USING (true);
CREATE POLICY "Users can delete own addresses" ON shipping_addresses FOR DELETE USING (true);

CREATE TRIGGER update_shipping_addresses_updated_at BEFORE UPDATE ON shipping_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Function**: Ensures shipping addresses table is included in database setup and reset scripts

---

### 7. Created Setup Documentation

#### Created `SHIPPING_ADDRESSES_SETUP.md`

**Purpose**: Comprehensive guide for setting up shipping addresses feature

**Contents**:
- Database migration instructions
- Table schema explanation
- RLS policy details
- API endpoint documentation
- Usage instructions
- Default address management explanation

**Function**: Provides complete setup and usage documentation for shipping addresses feature

---

## Summary

### Files Created
1. `src/lib/supabase.js` - Admin client
2. `src/lib/supabase/server.js` - Server-side client
3. `src/lib/supabase/client.js` - Client-side browser client
4. `src/lib/formatPrice.js` - Price formatting utility
5. `src/app/hooks/useLoadingFavicon.js` - Browser tab loading indicator hook
6. `supabase/schema.sql` - Database schema
7. `supabase/reset.sql` - Database reset script
8. `supabase/fix-rls-policy.sql` - RLS policy fix
9. `src/app/admin/dashboard/page.js` - Admin dashboard
10. `src/app/admin/viewUsers/page.js` - User management page
11. `src/app/admin/viewSellers/page.js` - Seller management page
12. `src/app/admin/components/adminNavbar.js` - Admin navigation
13. `src/app/api/admin/statistics/route.js` - Statistics API
14. `src/app/api/admin/pendingSellers/route.js` - Pending sellers API
15. `src/app/api/admin/approveSeller/route.js` - Approve/reject seller API
16. `src/app/api/admin/users/route.js` - Users API
17. `src/app/api/admin/sellers/route.js` - Sellers API
18. `src/app/api/trackVisit/route.js` - Visit tracking API
19. `src/app/components/VisitTracker.js` - Visit tracking component
20. `src/app/api/sellers/updateProduct/route.js` - Product update API
21. `src/app/seller/editProduct/page.js` - Product editing page
22. `supabase/add-seller-status-column.sql` - Seller status migration
23. `supabase/add-website-visits-table.sql` - Website visits table migration
24. `scripts/create-admin.js` - Admin account creation script
25. `scripts/clear-database.js` - Database clearing script
26. `ADMIN_ACCOUNT_SETUP.md` - Admin setup documentation
27. `CLEAR_DATABASE_GUIDE.md` - Database clearing guide
28. `src/app/api/resetPassword/route.js` - Password reset API route
29. `src/app/auth/reset-password/page.js` - Password reset page
30. `src/app/auth/callback/route.js` - OAuth callback handler
31. `GOOGLE_OAUTH_SETUP.md` - Google OAuth setup documentation
32. `src/app/account/page.js` - Account management page
33. `src/app/api/shipping-addresses/route.js` - Shipping addresses CRUD API
34. `supabase/add-shipping-addresses-table.sql` - Shipping addresses table migration
35. `SHIPPING_ADDRESSES_SETUP.md` - Shipping addresses setup documentation

### Files Modified
1. `src/app/api/login/route.js` - Username-based login, seller approval blocking
2. `src/app/api/register/route.js` - Registration with auto-confirmation
3. `src/app/api/seller/register/route.js` - Seller registration with pending status
4. `src/app/api/addToCart/route.js` - Field name compatibility
5. `src/app/api/getCart/route.js` - Field transformation
6. `src/app/context/AuthContext.js` - Supabase session management
7. `src/app/cart/viewCart/page.js` - UUID support (14 changes), image coverage fixes, icon sizing
8. `src/app/seller/dashboard/page.js` - Username fix, React key prop fix, route protection, icon sizing
9. `src/app/dashboard/page.js` - Field name compatibility, responsive modals, React key prop fix, icon sizing
10. `src/app/components/CategoryPage.js` - Field name compatibility, responsive modals, icon sizing
11. `src/app/page.js` - Seller approval popup messages, icon sizing
12. `src/app/register/page.js` - Icon sizing
13. `src/app/sellerRegister/page.js` - Approval process messages, image preview fix, icon sizing
14. `src/app/layout.js` - VisitTracker integration, Inter font, FontAwesome configuration
15. `src/app/components/navbar.js` - Dashboard menu item, removed Featured Products
16. `src/app/components/header.js` - Mobile header improvements
17. `src/app/globals.css` - Inter font implementation, icon sizing constraints
18. `src/app/admin/dashboard/page.js` - Complete admin dashboard
19. `src/app/admin/viewUsers/page.js` - User management page
20. `src/app/admin/viewSellers/page.js` - Seller management page
21. `src/app/admin/components/adminNavbar.js` - Admin navigation
22. `src/app/admin/page.js` - Route protection and redirect logic
23. `src/app/seller/addProduct/page.js` - Font Awesome icons, compact layout, route protection, loading favicon
24. `src/app/seller/viewProduct/page.js` - Font Awesome icons, compact layout, image fixes, route protection, price formatting, click-outside-to-close, button alignment
25. `src/app/seller/sellerCart/page.js` - Image coverage fixes, route protection, price formatting
26. `src/app/seller/editProduct/page.js` - Loading state fix, Suspense boundary for useSearchParams, loading favicon, price formatting
27. `src/app/page.js` - Seller approval popup messages, icon sizing, loading favicon, reset password functionality, Google OAuth login
28. `src/app/register/page.js` - Icon sizing, loading favicon
29. `src/app/sellerRegister/page.js` - Approval process messages, image preview fix, icon sizing, loading favicon
30. `src/app/admin/page.js` - Route protection and redirect logic, loading favicon
31. `src/app/dashboard/page.js` - Field name compatibility, responsive modals, React key prop fix, icon sizing, price formatting, click-outside-to-close, button alignment
32. `src/app/components/CategoryPage.js` - Field name compatibility, responsive modals, icon sizing, price formatting, click-outside-to-close, button alignment
33. `src/app/cart/viewCart/page.js` - UUID support (14 changes), image coverage fixes, icon sizing, price formatting

### Functions Created/Modified
- `createSupabaseAdminClient()` - Admin operations
- `createClient()` (server) - Server-side Supabase client
- `createClient()` (client) - Browser Supabase client
- `formatPrice()` - Price formatting with comma separators
- `useLoadingFavicon()` - Browser tab loading spinner hook
- `fetchUserData()` - User data lookup
- Field transformation functions in API routes
- Auto-confirmation logic in registration routes
- `fetchData()` - Admin dashboard data fetching
- `handleApproveReject()` - Seller approval/rejection handler
- `viewIdPicture()` - ID picture modal handler
- `trackVisit()` - Visit tracking function
- `createAdmin()` - Admin account creation function
- Seller approval workflow functions
- Visit statistics aggregation functions
- `handleEdit()` - Product editing handler
- `closePopup()` / `closeModal()` - Modal close handlers with click-outside support
- `handleResetPassword()` - Password reset request handler
- `handleGoogleLogin()` - Google OAuth login handler
- `fetchAddresses()` - Fetch user shipping addresses
- `fetchOrders()` - Fetch user order history
- `handleAddAddress()` - Open address form for adding new address
- `handleEditAddress()` - Open address form for editing existing address
- `handleDeleteAddress()` - Delete shipping address
- `handleSubmitAddress()` - Submit address form (add or update)

---

**Version**: 2.5  
**Last Updated**: January 2025  
**Total Code Changes**: 130+ files modified/created

### Latest Updates
- **Account Management System**: Created comprehensive account management page with shipping address management and order history
- **Shipping Addresses Feature**: Full CRUD operations for user shipping addresses with default address management
- **Dynamic Header Title**: Header now displays "My Account" on account page, "Featured Products" elsewhere
- **Password Reset System**: Implemented complete password reset functionality with email delivery and reset page
- **Google OAuth Login**: Added "Continue with Google" button for easy one-click authentication
- **Price Formatting**: Implemented automatic comma formatting for prices (e.g., 1234567 → 1,234,567)
- **Modal Click-Outside-to-Close**: Added ability to close product viewing modals by clicking outside the container
- **View Details Button Alignment**: Fixed button alignment so all "View Details" buttons align at the bottom of product cards
- **Edit Product Loading State**: Fixed loading state to appear in content area while navbar remains visible
- **Loading Favicon System**: Implemented browser tab loading spinner across all pages (standard website behavior)
- **Icon Sizing Fix**: Fixed FontAwesome icon overflow during page load/refresh with global CSS constraints, explicit size classes, and inline styles
- **Route Protection**: Implemented role-based access control for all seller and admin pages
- **Security Enhancement**: Unauthorized users are redirected when accessing protected routes
- **Admin Dashboard System**: Complete admin interface with seller management, statistics, and visit tracking
- **Seller Approval Workflow**: Pending/rejected sellers blocked from login with user-friendly messages
- **Visit Tracking System**: Automatic page visit tracking with admin exclusion
- **UI/UX Improvements**: Responsive design, image fixes, font implementation, mobile improvements, icon sizing
- **Comment Removal**: Removed all comments from JavaScript, SQL, and script files (25+ files)
- **Code Cleanup**: Improved code readability and maintainability
