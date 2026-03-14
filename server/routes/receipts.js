const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/receiptController');

router.use(authMiddleware);

router.get('/', ctrl.listReceipts);
router.get('/:id', ctrl.getReceipt);
router.post('/', validateBody([
    { field: 'supplier_name', label: 'Supplier Name', type: 'string', required: true },
    { field: 'warehouse_id', label: 'Warehouse', type: 'number', required: true },
]), ctrl.createReceipt);
router.put('/:id/validate', ctrl.validateReceipt);
router.put('/:id/cancel', ctrl.cancelReceipt);

module.exports = router;
