const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const ctrl = require('../controllers/dashboardController');

router.use(authMiddleware);

router.get('/kpis', ctrl.getKPIs);
router.get('/operations', ctrl.getOperations);

module.exports = router;
