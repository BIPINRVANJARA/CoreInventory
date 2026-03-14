const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/transferController');

router.use(authMiddleware);

router.get('/', ctrl.listTransfers);
router.get('/:id', ctrl.getTransfer);
router.post('/', validateBody([
    { field: 'from_location_id', label: 'Source Location', type: 'number', required: true },
    { field: 'to_location_id', label: 'Destination Location', type: 'number', required: true },
]), ctrl.createTransfer);
router.put('/:id/validate', ctrl.validateTransfer);

module.exports = router;
