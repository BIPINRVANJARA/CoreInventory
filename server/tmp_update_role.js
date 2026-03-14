const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function updateRole() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        const email = 'cyberidfc@gmail.com';
        console.log(`Attempting to update ${email} to admin...`);
        const [result] = await pool.query('UPDATE users SET role = "admin" WHERE email = ?', [email]);
        console.log('Update result:', result);

        const [users] = await pool.query('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
        console.log('Current user state:', users[0]);
    } catch (error) {
        console.error('Error updating role:', error);
    } finally {
        await pool.end();
    }
}

updateRole();
