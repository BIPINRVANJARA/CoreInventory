const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// GET /api/users — list all users (manager only)
async function listUsers(req, res) {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        sendSuccess(res, users);
    } catch (err) {
        console.error('List users error:', err);
        sendError(res, 'Failed to fetch users.');
    }
}

// POST /api/users — create staff account (manager only)
async function createUser(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // Check if email already exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return sendError(res, 'Email already registered.', 409);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, password_hash, role || 'staff']
        );

        sendSuccess(res, {
            id: result.insertId, name, email, role: role || 'staff'
        }, 'Staff account created successfully.', 201);
    } catch (err) {
        console.error('Create user error:', err);
        sendError(res, 'Failed to create user.');
    }
}

// DELETE /api/users/:id — remove user (manager only, no self-delete)
async function deleteUser(req, res) {
    try {
        const userId = parseInt(req.params.id);

        if (userId === req.user.id) {
            return sendError(res, 'You cannot delete your own account.', 400);
        }

        const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows === 0) {
            return sendError(res, 'User not found.', 404);
        }

        sendSuccess(res, null, 'User deleted successfully.');
    } catch (err) {
        console.error('Delete user error:', err);
        sendError(res, 'Failed to delete user.');
    }
}

// PUT /api/users/:id — update user (manager only, optionally changing password)
async function updateUser(req, res) {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, role, password } = req.body;

        // Check if email already exists for another user
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
        if (existing.length > 0) {
            return sendError(res, 'Email already registered.', 409);
        }

        let query = 'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role = COALESCE(?, role)';
        let params = [name, email, role];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash = ?';
            params.push(password_hash);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        const [result] = await pool.query(query, params);
        if (result.affectedRows === 0) {
            return sendError(res, 'User not found.', 404);
        }

        sendSuccess(res, null, 'User updated successfully.');
    } catch (err) {
        console.error('Update user error:', err);
        sendError(res, 'Failed to update user.');
    }
}

// PUT /api/users/me — update own profile
async function updateMe(req, res) {
    try {
        const userId = req.user.id;
        const { name, email, password } = req.body;

        // Check if email already exists for another user
        if (email) {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (existing.length > 0) {
                return sendError(res, 'Email already registered.', 409);
            }
        }

        let query = 'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email)';
        let params = [name, email];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += ', password_hash = ?';
            params.push(password_hash);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await pool.query(query, params);
        sendSuccess(res, null, 'Profile updated successfully.');
    } catch (err) {
        console.error('Update profile error:', err);
        sendError(res, 'Failed to update profile.');
    }
}

module.exports = { listUsers, createUser, deleteUser, updateUser, updateMe };
