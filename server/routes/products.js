const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validateBody } = require('../middleware/validate');
const ctrl = require('../controllers/productController');

router.use(authMiddleware);

router.get('/', ctrl.listProducts);
router.get('/categories', ctrl.listCategories);
router.get('/:id', ctrl.getProduct);
router.get('/:id/stock', ctrl.getProductStock);

router.post('/', validateBody([
    { field: 'name', label: 'Product Name', type: 'string', required: true, min: 2 },
    { field: 'sku', label: 'SKU', type: 'string', required: true, min: 2 },
    { field: 'unit_of_measure', label: 'Unit of Measure', type: 'string' },
    { field: 'reorder_point', label: 'Reorder Point', type: 'number', min: 0 },
]), ctrl.createProduct);

router.post('/categories', validateBody([
    { field: 'name', label: 'Category Name', type: 'string', required: true, min: 2 },
]), ctrl.createCategory);

router.put('/:id', ctrl.updateProduct);
router.delete('/:id', ctrl.deleteProduct);

module.exports = router;
