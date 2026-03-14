const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('--- Lot Size Migration ---');

        // Add lot_size
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN lot_size INT DEFAULT 1 AFTER sale_price
        `);
        console.log('✓ Added lot_size column to products table');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
