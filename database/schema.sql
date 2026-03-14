-- ==========================================================
-- Vyntro CoreInventory - Universal Database Schema
-- Version: 1.0.0
-- Author: Vanjara Bipin (Leader)
-- Description: Core table definitions for Auth, Inventory, 
--              Operations, and Financial Tracking.
-- ==========================================================

-- Users & Authentication
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, password_hash VARCHAR(255), role VARCHAR(20), created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE warehouses (id SERIAL PRIMARY KEY, name VARCHAR(100), code VARCHAR(20), address TEXT, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW());
CREATE TABLE products (id SERIAL PRIMARY KEY, name VARCHAR(100), sku VARCHAR(50) UNIQUE, category VARCHAR(50), unit VARCHAR(20), reorder_point INT DEFAULT 10, created_at TIMESTAMP DEFAULT NOW());
