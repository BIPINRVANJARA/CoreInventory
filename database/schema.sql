-- Vyntro CoreInventory Database Schema
CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100) UNIQUE, password_hash VARCHAR(255), role VARCHAR(20), created_at TIMESTAMP DEFAULT NOW());
