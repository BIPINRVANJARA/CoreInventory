const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/warehouseController');

router.use(authMiddleware);

router.get('/', ctrl.listLocations);
router.post('/', validateBody([
    { field: 'warehouse_id', label: 'Warehouse', type: 'number', required: true },
    { field: 'name', label: 'Name', type: 'string', required: true },
    { field: 'type', label: 'Type', enum: ['rack', 'shelf', 'floor', 'bin', 'zone'] },
]), ctrl.createLocation);
router.put('/:id', ctrl.updateLocation);
router.delete('/:id', ctrl.deleteLocation);

module.exports = router;
