const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/adjustmentController');

router.use(authMiddleware);

router.get('/', ctrl.listAdjustments);
router.post('/', requireRole('manager'), validateBody([
    { field: 'product_id', label: 'Product', type: 'number', required: true },
    { field: 'location_id', label: 'Location', type: 'number', required: true },
    { field: 'physical_qty', label: 'Physical Quantity', type: 'number', required: true, min: 0 },
    { field: 'reason', label: 'Reason', enum: ['damaged', 'lost', 'found', 'expired', 'recount', 'other'] },
]), ctrl.createAdjustment);

module.exports = router;
