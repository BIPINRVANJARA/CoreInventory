const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/warehouseController');

router.use(authMiddleware);

// Warehouses
router.get('/', ctrl.listWarehouses);
router.get('/:id', ctrl.getWarehouse);
router.post('/', requireRole('manager'), validateBody([
    { field: 'name', label: 'Name', type: 'string', required: true },
    { field: 'code', label: 'Code', type: 'string', required: true },
]), ctrl.createWarehouse);
router.put('/:id', requireRole('manager'), ctrl.updateWarehouse);

// Locations
router.get('/:warehouseId/locations', (req, res, next) => {
    req.query.warehouse_id = req.params.warehouseId;
    ctrl.listLocations(req, res, next);
});

module.exports = router;
