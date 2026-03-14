const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/userController');

// Auth required for all user routes
router.use(authMiddleware);

// Profile routes (Any authenticated user)
const authCtrl = require('../controllers/authController');
router.get('/me', authCtrl.getProfile);
router.put('/me', ctrl.updateMe);

// Management routes (Manager or Admin only)
router.use(requireRole('manager', 'admin'));

router.get('/', ctrl.listUsers);

router.post('/', validateBody([
    { field: 'name', label: 'Name', type: 'string', required: true },
    { field: 'email', label: 'Email', type: 'string', required: true },
    { field: 'password', label: 'Password', type: 'string', required: true, min: 6 },
    { field: 'role', label: 'Role', enum: ['manager', 'staff'] },
]), ctrl.createUser);

router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

module.exports = router;
