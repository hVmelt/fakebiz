-- =========================
-- Seed Products
-- =========================
INSERT INTO products (sku, name, price, stock)
VALUES
('KB-001', 'Mechanical Keyboard', 99.99, 25),
('MS-001', 'Wireless Mouse', 39.99, 40),
('HD-001', 'External Hard Drive', 129.99, 15),
('MN-001', 'Gaming Monitor', 299.99, 8),
('HP-001', 'Noise Cancelling Headphones', 199.99, 12);

-- =========================
-- Seed Customers
-- =========================
INSERT INTO customers (name, email)
VALUES
('Sarwat', 'sarwat@example.com'),
('Omar', 'omar@example.com'),
('Mishad', 'mishad@example.com');

-- =========================
-- Seed Orders
-- =========================
INSERT INTO orders (customer_id)
VALUES
(1),
(2),
(3);

-- =========================
-- Seed Order Items
-- =========================
INSERT INTO order_items (order_id, product_id, qty, price_at_purchase)
VALUES
(1, 1, 2, 99.99),
(1, 2, 1, 39.99),
(2, 3, 1, 129.99),
(2, 4, 1, 299.99),
(3, 1, 1, 99.99),
(3, 5, 2, 199.99);
