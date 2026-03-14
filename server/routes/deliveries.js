const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/deliveryController');

router.use(authMiddleware);

router.get('/', ctrl.listDeliveries);
router.get('/:id', ctrl.getDelivery);
router.post('/', validateBody([
    { field: 'customer_name', label: 'Customer Name', type: 'string', required: true },
    { field: 'warehouse_id', label: 'Warehouse', type: 'number', required: true },
]), ctrl.createDelivery);
router.put('/:id/step', ctrl.advanceStep);
router.put('/:id/validate', ctrl.validateDelivery);

module.exports = router;
