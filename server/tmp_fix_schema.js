const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function migrateAndSave() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Altering users table to add "admin" role...');
        await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('manager', 'staff', 'admin') NOT NULL DEFAULT 'staff'");
        console.log('Schema updated successfully.');

        const email = 'cyberidfc@gmail.com';
        console.log(`Updating ${email} to admin...`);
        await pool.query('UPDATE users SET role = "admin" WHERE email = ?', [email]);

        const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
        console.log('Final user state:', users[0]);
    } catch (error) {
        console.error('Migration/Update failed:', error);
    } finally {
        await pool.end();
    }
}

migrateAndSave();
