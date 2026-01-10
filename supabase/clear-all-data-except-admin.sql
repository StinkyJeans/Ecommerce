DELETE FROM cart_items;

DELETE FROM orders;

DELETE FROM products;

DELETE FROM website_visits;

DELETE FROM users 
WHERE role != 'admin' OR role IS NULL;

SELECT id, username, email, role, created_at 
FROM users 
ORDER BY created_at;

SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
    (SELECT COUNT(*) FROM users WHERE role != 'admin' OR role IS NULL) as other_users_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM cart_items) as cart_items_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM website_visits) as visits_count;
