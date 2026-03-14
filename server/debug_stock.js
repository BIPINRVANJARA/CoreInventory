const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function debug() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const [[{ productCount }]] = await pool.query('SELECT COUNT(*) as productCount FROM products');
        console.log('Total Products:', productCount);

        const [[{ stockTotal }]] = await pool.query('SELECT SUM(quantity) as stockTotal FROM stock_levels');
        console.log('Total Stock Quantity:', stockTotal);

        const [receiptItems] = await pool.query('SELECT COUNT(*) as cnt FROM receipt_items');
        console.log('Receipt Items Count:', receiptItems[0].cnt);

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await pool.end();
    }
}

debug();
