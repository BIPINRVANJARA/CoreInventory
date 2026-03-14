-- CoreInventory Seed Data
-- Demo data for all tables

USE core_inventory;

-- ============================================
-- USERS (password is 'password123' hashed with bcrypt)
-- ============================================
INSERT INTO users (name, email, password_hash, role) VALUES
('Alex Johnson', 'alex@vyntro.com', '$2b$10$YKQEQWjGKfiD.bPKkVCdKeIEjKIBax2tQeFYJIIY1RVZS.RuJjHTe', 'manager'),
('Sarah Miller', 'sarah@vyntro.com', '$2b$10$YKQEQWjGKfiD.bPKkVCdKeIEjKIBax2tQeFYJIIY1RVZS.RuJjHTe', 'staff'),
('Ravi Kumar', 'ravi@vyntro.com', '$2b$10$YKQEQWjGKfiD.bPKkVCdKeIEjKIBax2tQeFYJIIY1RVZS.RuJjHTe', 'staff'),
('Priya Sharma', 'priya@vyntro.com', '$2b$10$YKQEQWjGKfiD.bPKkVCdKeIEjKIBax2tQeFYJIIY1RVZS.RuJjHTe', 'manager');

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, laptops, and electronic accessories'),
('Raw Materials', 'Steel, aluminum, plastics, and industrial materials'),
('Office Supplies', 'Stationery, paper, ink, and office equipment'),
('Furniture', 'Desks, chairs, shelves, and storage units'),
('Packaging', 'Boxes, tape, bubble wrap, and packaging supplies');

-- ============================================
-- WAREHOUSES
-- ============================================
INSERT INTO warehouses (name, code, address, is_active) VALUES
('Central Warehouse', 'CW-01', '123 Industrial Blvd, Mumbai, MH 400001', TRUE),
('North Branch', 'NB-02', '456 Commerce St, Delhi, DL 110001', TRUE),
('West Side Storage', 'WS-03', '789 Logistics Park, Ahmedabad, GJ 380001', TRUE);

-- ============================================
-- LOCATIONS
-- ============================================
INSERT INTO locations (warehouse_id, name, type) VALUES
-- Central Warehouse
(1, 'Rack A1', 'rack'),
(1, 'Rack A2', 'rack'),
(1, 'Shelf B1', 'shelf'),
(1, 'Floor Zone C', 'floor'),
-- North Branch
(2, 'Rack N1', 'rack'),
(2, 'Shelf N2', 'shelf'),
(2, 'Bin N3', 'bin'),
-- West Side Storage
(3, 'Zone W1', 'zone'),
(3, 'Rack W2', 'rack');

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, description) VALUES
('iPhone 15 Pro Max', 'ELEC-IPH15PM', 1, 'units', 20, 'Apple iPhone 15 Pro Max 256GB'),
('MacBook Air M2', 'ELEC-MBA-M2', 1, 'units', 10, 'Apple MacBook Air M2 13-inch'),
('Logitech MX Master 3', 'ELEC-LGT-MX3', 1, 'units', 25, 'Wireless mouse for productivity'),
('Sony WH-1000XM5', 'ELEC-SNY-XM5', 1, 'units', 15, 'Noise cancelling headphones'),
('Steel Rods (1m)', 'RAW-STL-ROD1', 2, 'kg', 100, 'Industrial grade steel rods, 1 meter length'),
('Aluminum Sheets', 'RAW-ALU-SHT', 2, 'kg', 50, 'Aluminum sheets 2mm thickness'),
('Plastic Pellets', 'RAW-PLS-PEL', 2, 'kg', 200, 'High-density polyethylene pellets'),
('A4 Paper Ream', 'OFF-A4-500', 3, 'packs', 30, '500 sheets A4 paper, 80gsm'),
('Printer Ink Cartridge', 'OFF-INK-BK', 3, 'units', 10, 'Black ink cartridge for laser printers'),
('Ergonomic Office Chair', 'FUR-CHR-ERG', 4, 'units', 5, 'Adjustable ergonomic office chair'),
('Standing Desk', 'FUR-DSK-STD', 4, 'units', 3, 'Electric height-adjustable standing desk'),
('Metal Storage Shelf', 'FUR-SHF-MTL', 4, 'units', 8, '5-tier metal storage shelf'),
('Cardboard Box (Large)', 'PKG-BOX-LG', 5, 'units', 100, 'Large cardboard shipping box 60x40x40cm'),
('Bubble Wrap Roll', 'PKG-BWR-50M', 5, 'units', 20, 'Bubble wrap roll 50m x 1m'),
('Packing Tape', 'PKG-TPE-48', 5, 'rolls', 50, 'Clear packing tape 48mm x 100m');

-- ============================================
-- STOCK LEVELS (Initial inventory)
-- ============================================
INSERT INTO stock_levels (product_id, location_id, quantity) VALUES
-- Central Warehouse stocks
(1, 1, 45),   -- iPhone 15 PM on Rack A1
(2, 1, 12),   -- MacBook Air on Rack A1
(3, 2, 60),   -- MX Master 3 on Rack A2
(4, 2, 8),    -- Sony XM5 on Rack A2 (LOW STOCK)
(5, 4, 250),  -- Steel Rods on Floor Zone C
(6, 4, 120),  -- Aluminum Sheets on Floor Zone C
(7, 3, 180),  -- Plastic Pellets on Shelf B1
(8, 3, 45),   -- A4 Paper on Shelf B1
(9, 3, 5),    -- Ink Cartridge on Shelf B1 (LOW STOCK)
(10, 4, 3),   -- Office Chair on Floor (LOW STOCK)
-- North Branch stocks
(1, 5, 30),   -- iPhone 15 PM on Rack N1
(3, 5, 15),   -- MX Master 3 on Rack N1
(11, 6, 2),   -- Standing Desk on Shelf N2 (LOW STOCK)
(13, 7, 85),  -- Cardboard Box in Bin N3
-- West Side Storage stocks
(5, 8, 500),  -- Steel Rods in Zone W1
(12, 9, 20),  -- Metal Shelf on Rack W2
(14, 8, 35),  -- Bubble Wrap in Zone W1
(15, 9, 60);  -- Packing Tape on Rack W2

-- ============================================
-- SAMPLE RECEIPTS
-- ============================================
INSERT INTO receipts (reference_no, supplier_name, warehouse_id, status, created_by, validated_at) VALUES
('WH/IN/00141', 'Apple India Pvt Ltd', 1, 'done', 1, '2024-01-15 10:30:00'),
('WH/IN/00142', 'Apple India Pvt Ltd', 1, 'done', 1, '2024-01-20 14:00:00'),
('WH/IN/00143', 'Tata Steel Limited', 1, 'waiting', 2, NULL),
('WH/IN/00144', 'Office Depot India', 2, 'draft', 3, NULL);

INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES
(1, 1, 50),   -- 50 iPhones
(1, 2, 15),   -- 15 MacBooks
(2, 3, 80),   -- 80 MX Master 3
(2, 4, 25),   -- 25 Sony XM5
(3, 5, 500),  -- 500kg Steel Rods (pending)
(4, 8, 100),  -- 100 A4 Paper Reams (draft)
(4, 9, 20);   -- 20 Ink Cartridges (draft)

-- ============================================
-- SAMPLE DELIVERY ORDERS
-- ============================================
INSERT INTO delivery_orders (reference_no, customer_name, warehouse_id, status, workflow_step, created_by, validated_at) VALUES
('WH/OUT/00891', 'TechMart Electronics', 1, 'done', 'validate', 1, '2024-01-18 16:00:00'),
('WH/OUT/00892', 'GlobalTech Solutions', 2, 'ready', 'pack', 2, NULL),
('WH/OUT/00893', 'SoundWave Audio', 1, 'draft', 'pick', 1, NULL),
('WH/OUT/00894', 'OfficeHub Corp', 1, 'waiting', 'pick', 3, NULL);

INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES
(1, 1, 5),    -- 5 iPhones delivered
(1, 2, 3),    -- 3 MacBooks delivered
(2, 2, 10),   -- 10 MacBooks ready
(3, 4, 12),   -- 12 Sony XM5 draft
(4, 10, 2),   -- 2 Office Chairs waiting
(4, 8, 15);   -- 15 A4 Paper waiting

-- ============================================
-- SAMPLE INTERNAL TRANSFERS
-- ============================================
INSERT INTO internal_transfers (reference_no, from_location_id, to_location_id, status, created_by) VALUES
('WH/INT/00044', 1, 5, 'done', 1),
('WH/INT/00045', 2, 8, 'waiting', 2),
('WH/INT/00046', 4, 9, 'draft', 3);

INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES
(1, 1, 10),   -- 10 iPhones Central→North
(2, 3, 50),   -- 50 MX Master Rack A2→Zone W1
(3, 5, 200);  -- 200kg Steel Floor→Rack W2

-- ============================================
-- SAMPLE STOCK ADJUSTMENTS
-- ============================================
INSERT INTO stock_adjustments (reference_no, product_id, location_id, recorded_qty, physical_qty, reason, notes, created_by) VALUES
('WH/ADJ/00011', 4, 2, 10, 8, 'damaged', '2 units found damaged during inspection', 1),
('WH/ADJ/00012', 7, 3, 200, 180, 'lost', 'Discrepancy found during physical count', 2);

-- ============================================
-- SAMPLE STOCK LEDGER ENTRIES
-- ============================================
INSERT INTO stock_ledger (product_id, movement_type, from_location_id, to_location_id, qty_change, reference_no, notes, created_by) VALUES
-- Receipt entries
(1, 'incoming', NULL, 1, 50, 'WH/IN/00141', 'Received from Apple India', 1),
(2, 'incoming', NULL, 1, 15, 'WH/IN/00141', 'Received from Apple India', 1),
(3, 'incoming', NULL, 2, 80, 'WH/IN/00142', 'Received from Apple India', 1),
(4, 'incoming', NULL, 2, 25, 'WH/IN/00142', 'Received from Apple India', 1),
-- Delivery entries
(1, 'outgoing', 1, NULL, -5, 'WH/OUT/00891', 'Delivered to TechMart', 1),
(2, 'outgoing', 1, NULL, -3, 'WH/OUT/00891', 'Delivered to TechMart', 1),
-- Transfer entries
(1, 'transfer_out', 1, NULL, -10, 'WH/INT/00044', 'Transfer to North Branch', 1),
(1, 'transfer_in', NULL, 5, 10, 'WH/INT/00044', 'Transfer from Central', 1),
-- Adjustment entries
(4, 'adjustment', NULL, 2, -2, 'WH/ADJ/00011', 'Damaged units written off', 1),
(7, 'adjustment', NULL, 3, -20, 'WH/ADJ/00012', 'Physical count discrepancy', 2);
