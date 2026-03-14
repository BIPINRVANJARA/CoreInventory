const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const ctrl = require('../controllers/ledgerController');

router.use(authMiddleware);

router.get('/', ctrl.listLedger);
router.get('/export', requireRole('manager'), ctrl.exportLedger);

module.exports = router;
