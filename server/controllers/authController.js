const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { sendOTP } = require('../utils/emailService');
const { sendSuccess, sendError } = require('../utils/helpers');

// POST /api/auth/register
async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // Check if user exists
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return sendError(res, 'Email already registered.', 409);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Insert user
        const [result] = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [name, email, password_hash, role || 'staff']
        );

        // Generate token
        const token = jwt.sign(
            { id: result.insertId, email, role: role || 'staff', name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        sendSuccess(res, { token, user: { id: result.insertId, name, email, role: role || 'staff' } }, 'Registration successful.', 201);
    } catch (err) {
        console.error('Register error:', err);
        sendError(res, 'Registration failed.');
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return sendError(res, 'Invalid email or password.', 401);
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return sendError(res, 'Invalid email or password.', 401);
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await pool.query(
            'UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE email = ?',
            [otp, email]
        );

        // Send real email OTP
        try {
            await sendOTP(user.email, otp);
            sendSuccess(res, {
                twoFactorRequired: true,
                email: user.email
            }, 'Verification code has been sent to your email.');
        } catch (mailError) {
            console.error('Failed to send OTP email:', mailError);
            sendError(res, 'Authentication passed, but failed to send verification email. Please contact support.', 500);
        }
    } catch (err) {
        console.error('Login error:', err);
        sendError(res, 'Login failed.');
    }
}

// POST /api/auth/verify-2fa
async function verify2FA(req, res) {
    try {
        const { email, otp } = req.body;

        const [users] = await pool.query(
            'SELECT id, name, email, role, otp_code, (otp_expires_at < NOW()) as is_expired FROM users WHERE email = ?',
            [email]
        );
        if (users.length === 0) return sendError(res, 'Invalid email.', 404);

        const user = users[0];
        console.log(`[DEBUG] Verify2FA - User: ${email}, Input: [${otp}], Stored: [${user.otp_code}], Expired: ${user.is_expired}`);

        if (!user.otp_code || String(user.otp_code).trim() !== String(otp).trim()) {
            return sendError(res, 'Invalid OTP.', 400);
        }

        if (user.is_expired) {
            return sendError(res, 'OTP has expired.', 400);
        }

        // Clear OTP
        await pool.query('UPDATE users SET otp_code = NULL, otp_expires_at = NULL WHERE id = ?', [user.id]);

        // Generate final JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        sendSuccess(res, {
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        }, 'Login successful.');
    } catch (err) {
        console.error('2FA verification error:', err);
        sendError(res, 'Verification failed.');
    }
}

// POST /api/auth/forgot-password
async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        const [users] = await pool.query('SELECT id, email FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return sendError(res, 'No account found with that email.', 404);
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

        await pool.query('UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE email = ?', [otp, expiry, email]);

        // Send OTP via email
        try {
            await sendOTP(email, otp);
            sendSuccess(res, { otp_sent: true }, 'OTP sent to your email.');
        } catch (mailError) {
            console.error('Failed to send forgot password email:', mailError);
            sendError(res, 'OTP generated, but failed to send email. Please try again later.', 500);
        }
    } catch (err) {
        console.error('Forgot password error:', err);
        sendError(res, 'Failed to request password reset.');
    }
}

// POST /api/auth/verify-otp
async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        const [users] = await pool.query(
            'SELECT id, otp_code, otp_expires_at, (otp_expires_at < NOW()) as is_expired FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return sendError(res, 'Invalid email.', 404);
        }

        const user = users[0];
        console.log(`[DEBUG] VerifyOTP - User: ${email}, Input: [${otp}], Stored: [${user.otp_code}], Expired: ${user.is_expired}`);

        if (!user.otp_code || String(user.otp_code).trim() !== String(otp).trim()) {
            return sendError(res, 'Invalid OTP.', 400);
        }

        if (user.is_expired) {
            return sendError(res, 'OTP has expired. Please request a new one.', 400);
        }

        sendSuccess(res, { verified: true }, 'OTP verified successfully.');
    } catch (err) {
        console.error('Verify OTP error:', err);
        sendError(res, 'OTP verification failed.');
    }
}

// POST /api/auth/reset-password
async function resetPassword(req, res) {
    try {
        const { email, otp, new_password } = req.body;

        const [users] = await pool.query(
            'SELECT id, otp_code, (otp_expires_at < NOW()) as is_expired FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) return sendError(res, 'Invalid email.', 404);

        const user = users[0];
        console.log(`[DEBUG] ResetPassword - User: ${email}, Input: [${otp}], Stored: [${user.otp_code}], Expired: ${user.is_expired}`);

        if (!user.otp_code || String(user.otp_code).trim() !== String(otp).trim()) return sendError(res, 'Invalid OTP.', 400);

        if (user.is_expired) return sendError(res, 'OTP expired.', 400);

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE email = ?',
            [password_hash, email]
        );

        sendSuccess(res, null, 'Password reset successful.');
    } catch (err) {
        console.error('Reset password error:', err);
        sendError(res, 'Password reset failed.');
    }
}

// POST /api/auth/request-password-change-otp
async function requestPasswordChangeOTP(req, res) {
    try {
        const userId = req.user.id;
        console.log(`[DEBUG] requestPasswordChangeOTP - userId: ${userId}`);
        const [users] = await pool.query('SELECT email FROM users WHERE id = ?', [userId]);

        if (users.length === 0) return sendError(res, 'User not found.', 404);
        const email = users[0].email;

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        await pool.query(
            'UPDATE users SET otp_code = ?, otp_expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE) WHERE id = ?',
            [otp, userId]
        );

        try {
            await sendOTP(email, otp);
            sendSuccess(res, null, 'Verification code sent to your email.');
        } catch (mailError) {
            console.error('Failed to send password change OTP:', mailError);
            sendError(res, 'Failed to send verification email.', 500);
        }
    } catch (err) {
        console.error('Request password change OTP error:', err);
        sendError(res, `Failed to request verification code: ${err.message}`);
    }
}

// POST /api/auth/verify-password-change
async function verifyPasswordChange(req, res) {
    try {
        const userId = req.user.id;
        const { otp, new_password } = req.body;

        const [users] = await pool.query(
            'SELECT otp_code, otp_expires_at, (otp_expires_at < NOW()) as is_expired FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) return sendError(res, 'User not found.', 404);

        const user = users[0];
        console.log(`[DEBUG] ProfileUpdateOTP - UserID: ${userId}, Input: [${otp}], Stored: [${user.otp_code}], ExpiredInDB: ${user.is_expired}, ExpiryVal: ${user.otp_expires_at}`);

        if (!user.otp_code || String(user.otp_code).trim() !== String(otp).trim()) {
            return sendError(res, 'Invalid verification code.', 400);
        }

        if (user.is_expired) return sendError(res, 'Code has expired.', 400);

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [password_hash, userId]
        );

        sendSuccess(res, null, 'Password updated successfully.');
    } catch (err) {
        console.error('Verify password change error:', err);
        sendError(res, 'Failed to update password.');
    }
}

// GET /api/auth/me
async function getProfile(req, res) {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        if (users.length === 0) return sendError(res, 'User not found.', 404);
        sendSuccess(res, users[0]);
    } catch (err) {
        console.error('Get profile error:', err);
        sendError(res, 'Failed to get profile.');
    }
}

module.exports = {
    register, login, verify2FA, forgotPassword,
    verifyOtp, resetPassword, requestPasswordChangeOTP,
    verifyPasswordChange, getProfile
};
