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
        const [receipts] = await pool.query('SELECT id, reference_no, is_order, total_amount, paid_amount, status FROM receipts LIMIT 10');
        console.log('Receipts Sample:', receipts);

        const [summary] = await pool.query(`
            SELECT 
                COUNT(*) as total_count,
                SUM(is_order) as order_count,
                SUM(total_amount) as sum_total,
                SUM(paid_amount) as sum_paid
            FROM receipts
        `);
        console.log('Database Summary:', summary[0]);

    } catch (error) {
        console.error('Debug failed:', error);
    } finally {
        await pool.end();
    }
}

debug();
