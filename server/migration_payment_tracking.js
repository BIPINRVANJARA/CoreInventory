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
        console.log('Adding payment columns to receipts table...');

        const alterTableQuery = `
            ALTER TABLE receipts 
            ADD COLUMN is_order BOOLEAN DEFAULT FALSE,
            ADD COLUMN total_amount DECIMAL(15,2) DEFAULT 0.00,
            ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00,
            ADD COLUMN payment_status ENUM('pending', 'partial_advance', 'full_advance', 'custom_amount', 'after_delivery') DEFAULT 'pending',
            ADD COLUMN payment_due_date DATE DEFAULT NULL
        `;

        await pool.query(alterTableQuery);
        console.log('Receipts table updated.');

        // Update existing receipts to have some default values if needed
        // (Not strictly necessary as defaults are set)

        console.log('Creating payment_history table...');
        const createPaymentHistoryQuery = `
            CREATE TABLE IF NOT EXISTS payment_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                receipt_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                payment_method VARCHAR(50) DEFAULT 'other',
                notes TEXT,
                FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `;
        await pool.query(createPaymentHistoryQuery);
        console.log('payment_history table created.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
