-- Force delete all users except admins
-- This script uses direct SQL to bypass any RLS policies
-- WARNING: This will permanently delete all non-admin users!

-- First, let's see what we have
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY role, created_at;

-- Delete all users where role is NOT 'admin'
-- This will delete users with role = 'user', 'seller', or NULL
DELETE FROM users 
WHERE role IS NULL 
   OR role != 'admin'
   OR (role IS NOT NULL AND role NOT IN ('admin'));

-- Verify: Show remaining users (should only be admins)
SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;

-- Show summary
SELECT 
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role != 'admin' OR role IS NULL) as other_users_count
FROM users;
