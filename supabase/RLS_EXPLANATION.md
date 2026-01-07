# Row Level Security (RLS) Policies Explained

## Understanding RLS Policy Syntax

### Policy Clauses

PostgreSQL RLS policies use two main clauses:

1. **`USING` clause** - Controls which **existing rows** can be accessed
   - Used for: `SELECT`, `UPDATE`, `DELETE`
   - Answers: "Can I see/modify this existing row?"

2. **`WITH CHECK` clause** - Controls which **new/updated values** are allowed
   - Used for: `INSERT`, `UPDATE`
   - Answers: "Can I insert/update with these values?"

### Why `WITH CHECK (true)` for INSERT?

```sql
CREATE POLICY "Users can insert" ON users
  FOR INSERT WITH CHECK (true);
```

**Explanation:**
- `FOR INSERT` - This policy applies to INSERT operations
- `WITH CHECK (true)` - Allows **any** row to be inserted (no restrictions)
- `true` means "always allow" - no conditions to check

### Policy Examples

#### Example 1: Allow All Inserts (Current Setup)
```sql
CREATE POLICY "Users can insert" ON users
  FOR INSERT WITH CHECK (true);
```
✅ Allows anyone to register (needed for public registration)

#### Example 2: Restrictive Insert (More Secure)
```sql
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT 
  WITH CHECK (auth.uid()::text = username);
```
⚠️ Only allows users to insert rows where the username matches their auth user ID

#### Example 3: Select Policy (USING clause)
```sql
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);
```
- `USING (true)` - Can read all rows (no restrictions)
- For SELECT, we use `USING`, not `WITH CHECK`

#### Example 4: Secure Select Policy
```sql
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = username);
```
⚠️ Users can only see rows where username matches their auth ID

## Current Setup vs Production

### Current Setup (Development)
```sql
-- Allows all operations (for easy development)
CREATE POLICY "Users can insert" ON users
  FOR INSERT WITH CHECK (true);
```

**Why we use this:**
- ✅ Simple and works immediately
- ✅ Allows public registration
- ✅ No complex auth checks needed
- ⚠️ Not secure for production (anyone can insert)

### Production Setup (Recommended)
```sql
-- More secure: only authenticated users can insert
CREATE POLICY "Authenticated users can insert" ON users
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
```

Or even more restrictive:
```sql
-- Only allow inserting if username matches auth user
CREATE POLICY "Users can insert own record" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid()::text = username OR
    auth.email() = email
  );
```

## Policy Types by Operation

| Operation | Clause Used | Purpose |
|-----------|-------------|---------|
| `SELECT` | `USING` | Which rows can be read |
| `INSERT` | `WITH CHECK` | What values can be inserted |
| `UPDATE` | `USING` + `WITH CHECK` | Which rows can be updated + what new values allowed |
| `DELETE` | `USING` | Which rows can be deleted |

## UPDATE Policies (Both Clauses)

```sql
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid()::text = username)      -- Can only update own row
  WITH CHECK (auth.uid()::text = username); -- New values must still be own row
```

- `USING` - Which existing rows can be updated
- `WITH CHECK` - What the updated values can be

## Why `true` is Used

`WITH CHECK (true)` means:
- ✅ **No restrictions** - any data can be inserted
- ✅ **Simple** - works immediately without auth setup
- ✅ **Good for development** - allows testing registration
- ⚠️ **Not secure** - should be restricted in production

## Security Recommendations

For production, consider:

1. **Require authentication:**
   ```sql
   WITH CHECK (auth.role() = 'authenticated')
   ```

2. **Match auth user:**
   ```sql
   WITH CHECK (auth.uid()::text = username)
   ```

3. **Validate email matches:**
   ```sql
   WITH CHECK (auth.email() = email)
   ```

4. **Combine conditions:**
   ```sql
   WITH CHECK (
     auth.role() = 'authenticated' AND
     (auth.uid()::text = username OR auth.email() = email)
   )
   ```

## Current Policy Summary

Our current policies allow:
- ✅ **SELECT**: Everyone can read (`USING (true)`)
- ✅ **INSERT**: Everyone can insert (`WITH CHECK (true)`)
- ✅ **UPDATE**: Everyone can update (`USING (true)`)

This is **fine for development** but should be **restricted for production**.
