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
        console.log('--- Product Prices Migration ---');

        // Add cost_price
        await pool.query(`
            ALTER TABLE products 
            ADD COLUMN cost_price DECIMAL(15,2) DEFAULT 0.00 AFTER sku,
            ADD COLUMN sale_price DECIMAL(15,2) DEFAULT 0.00 AFTER cost_price
        `);
        console.log('✓ Added cost_price and sale_price columns to products table');

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
