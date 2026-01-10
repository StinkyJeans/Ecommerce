SELECT id, username, email, role, created_at 
FROM users 
ORDER BY role, created_at;

DELETE FROM users 
WHERE role IS NULL 
   OR role != 'admin'
   OR (role IS NOT NULL AND role NOT IN ('admin'));

SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;

SELECT 
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role != 'admin' OR role IS NULL) as other_users_count
FROM users;
