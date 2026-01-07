# Supabase Migrations

This directory is for Supabase CLI migrations (the Supabase way).

## Using Supabase CLI

If you're using Supabase CLI, you can create migrations here:

```bash
# Create a new migration
supabase migration new migration_name

# Apply migrations
supabase db push

# Reset database
supabase db reset
```

## Current Schema

The current schema is in `../schema.sql`. To use it with Supabase CLI:

1. Copy `schema.sql` to a migration file:
   ```bash
   cp schema.sql migrations/YYYYMMDDHHMMSS_initial_schema.sql
   ```

2. Apply it:
   ```bash
   supabase db push
   ```

## Migration Files

Migration files should be named with timestamp prefix:
- Format: `YYYYMMDDHHMMSS_description.sql`
- Example: `20240101120000_initial_schema.sql`

This ensures migrations run in the correct order.
