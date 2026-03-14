const express = require('express');
const router = express.Router();
const { validateBody } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

// Public routes
router.post('/register', validateBody([
    { field: 'name', label: 'Name', type: 'string', required: true, min: 2, max: 100 },
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'password', label: 'Password', type: 'string', required: true, min: 6 },
    { field: 'role', label: 'Role', enum: ['manager', 'staff'] },
]), ctrl.register);

router.post('/login', validateBody([
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'password', label: 'Password', type: 'string', required: true },
]), ctrl.login);

router.post('/verify-2fa', validateBody([
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'otp', label: 'OTP', type: 'string', required: true, min: 6, max: 6 },
]), ctrl.verify2FA);

router.post('/forgot-password', validateBody([
    { field: 'email', label: 'Email', type: 'email', required: true },
]), ctrl.forgotPassword);

router.post('/verify-otp', validateBody([
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'otp', label: 'OTP', type: 'string', required: true, min: 6, max: 6 },
]), ctrl.verifyOtp);

router.post('/reset-password', validateBody([
    { field: 'email', label: 'Email', type: 'email', required: true },
    { field: 'otp', label: 'OTP', type: 'string', required: true },
    { field: 'new_password', label: 'New Password', type: 'string', required: true, min: 6 },
]), ctrl.resetPassword);

// Protected routes
router.get('/me', authMiddleware, ctrl.getProfile);
router.post('/request-password-change-otp', authMiddleware, ctrl.requestPasswordChangeOTP);
router.post('/verify-password-change', authMiddleware, validateBody([
    { field: 'otp', label: 'OTP', type: 'string', required: true, min: 6, max: 6 },
    { field: 'new_password', label: 'New Password', type: 'string', required: true, min: 6 },
]), ctrl.verifyPasswordChange);

module.exports = router;
