# Supabase Setup - Next.js Best Practices

This project follows the [official Supabase Next.js quickstart guide](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs).

## Environment Variables

Update your `.env.local` file with these variables:

```env
# Required - Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Use either the new publishable key OR legacy anon key
# New publishable key (recommended)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx

# OR legacy anon key (still supported)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Required for admin operations (scripts, migrations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Where to Find These Values

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (new) or **anon key** (legacy) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

## Architecture

### Server-Side (API Routes, Server Components)

Use the server client for all API routes:

```javascript
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient(); // Note: await is required
  const { data } = await supabase.from('users').select();
  return Response.json(data);
}
```

**Location:** `src/lib/supabase/server.js`

**Features:**
- Cookie-based authentication
- Automatic session management
- Server-side only (uses Next.js `cookies()`)

### Client-Side (Client Components)

Use the browser client for client components:

```javascript
'use client';
import { createClient } from '@/lib/supabase/client';

export function MyComponent() {
  const supabase = createClient(); // No await needed
  // Use supabase client...
}
```

**Location:** `src/lib/supabase/client.js`

**Features:**
- Cookie-based authentication
- Works in browser
- Automatic session refresh

### Admin Operations (Scripts Only)

For admin operations and scripts:

```javascript
import { createSupabaseAdminClient } from '@/lib/supabase';

const supabase = createSupabaseAdminClient();
// Use for migrations, admin operations
```

**Location:** `src/lib/supabase.js`

**Features:**
- Uses service role key (full access)
- No session management
- Server-side only

## Key Changes from Previous Setup

1. **Cookie-Based Auth**: Now uses `@supabase/ssr` for proper cookie handling
2. **Separate Clients**: Server and client have separate implementations
3. **Async Server Client**: Server client is now async (uses `await createClient()`)
4. **Key Support**: Supports both new publishable key and legacy anon key

## Installation

Make sure you have the required package:

```bash
npm install @supabase/ssr
```

This package is already added to `package.json`.

## Usage Examples

### API Route Example

```javascript
// src/app/api/users/route.js
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('users').select();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Client Component Example

```javascript
// src/app/components/UserProfile.js
'use client';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

export function UserProfile() {
  const [user, setUser] = useState(null);
  const supabase = createClient();
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);
  
  return <div>{user?.email}</div>;
}
```

## References

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR Package](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [API Keys Documentation](https://supabase.com/docs/guides/api/api-keys)
