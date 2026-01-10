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

-- Show counts
SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE role != 'admin' OR role IS NULL) as other_users_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM cart_items) as cart_items_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM website_visits) as visits_count;
