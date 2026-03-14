const pool = require('../config/db');
const { sendSuccess, sendError, getPagination } = require('../utils/helpers');

// GET /api/products
async function listProducts(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { search, category_id, status } = req.query;

        let where = ['1=1'];
        let params = [];

        if (search) {
            where.push('(p.name LIKE ? OR p.sku LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }
        if (category_id) {
            where.push('p.category_id = ?');
            params.push(category_id);
        }
        if (status === 'active') {
            where.push('p.is_active = TRUE');
        } else if (status === 'inactive') {
            where.push('p.is_active = FALSE');
        }

        const whereClause = where.join(' AND ');

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM products p WHERE ${whereClause}`, params
        );

        const [products] = await pool.query(
            `SELECT p.*, c.name as category_name,
              COALESCE(SUM(sl.quantity), 0) as total_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN stock_levels sl ON p.id = sl.product_id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        sendSuccess(res, {
            products,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        console.error('List products error:', err);
        sendError(res, 'Failed to fetch products.');
    }
}

// GET /api/products/:id
async function getProduct(req, res) {
    try {
        const [products] = await pool.query(
            `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = ?`,
            [req.params.id]
        );

        if (products.length === 0) return sendError(res, 'Product not found.', 404);
        sendSuccess(res, products[0]);
    } catch (err) {
        console.error('Get product error:', err);
        sendError(res, 'Failed to fetch product.');
    }
}

// POST /api/products
async function createProduct(req, res) {
    try {
        const { name, sku, category_id, unit_of_measure, reorder_point, description, cost_price, sale_price, lot_size } = req.body;



        // Check SKU uniqueness
        const [existing] = await pool.query('SELECT id FROM products WHERE sku = ?', [sku]);
        if (existing.length > 0) return sendError(res, 'SKU already exists.', 409);

        const [result] = await pool.query(
            `INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, description, cost_price, sale_price, lot_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, sku, category_id || null, unit_of_measure || 'units', reorder_point || 10, description || null, cost_price || 0, sale_price || 0, lot_size || 1]
        );

        sendSuccess(res, { id: result.insertId }, 'Product created successfully.', 201);
    } catch (err) {
        console.error('Create product error:', err);
        sendError(res, 'Failed to create product.');
    }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
    const fs = require('fs');
    try {
        const { name, sku, category_id, unit_of_measure, reorder_point, description, is_active, cost_price, sale_price, lot_size } = req.body;
        const logPath = './debug_log.txt';
        const logData = `[${new Date().toISOString()}] Update Data: ${JSON.stringify({ id: req.params.id, name, sku, category_id, cost_price, sale_price, lot_size })}\n`;
        fs.appendFileSync(logPath, logData);

        // Check SKU conflict
        if (sku) {
            const [existing] = await pool.query('SELECT id FROM products WHERE sku = ? AND id != ?', [sku, req.params.id]);
            if (existing.length > 0) return sendError(res, 'SKU already in use by another product.', 409);
        }

        const [result] = await pool.query(
            `UPDATE products SET 
                name = COALESCE(?, name), 
                sku = COALESCE(?, sku),
                category_id = COALESCE(?, category_id), 
                unit_of_measure = COALESCE(?, unit_of_measure),
                reorder_point = COALESCE(?, reorder_point), 
                description = COALESCE(?, description),
                is_active = COALESCE(?, is_active), 
                cost_price = COALESCE(?, cost_price), 
                sale_price = COALESCE(?, sale_price),
                lot_size = COALESCE(?, lot_size)
            WHERE id = ?`,
            [
                name || null,
                sku || null,
                category_id || null,
                unit_of_measure || null,
                reorder_point !== undefined ? reorder_point : null,
                description || null,
                is_active !== undefined ? is_active : null,
                cost_price !== undefined ? cost_price : null,
                sale_price !== undefined ? sale_price : null,
                lot_size !== undefined ? lot_size : null,
                req.params.id
            ]
        );

        fs.appendFileSync(logPath, `[${new Date().toISOString()}] Affected Rows: ${result.affectedRows}\n`);

        sendSuccess(res, null, 'Product updated successfully.');
    } catch (err) {
        fs.appendFileSync('./debug_log.txt', `[${new Date().toISOString()}] ERROR: ${err.message}\n`);


        console.error('Update product error:', err);
        sendError(res, 'Failed to update product.');
    }
}

// DELETE /api/products/:id
async function deleteProduct(req, res) {
    try {
        await pool.query('UPDATE products SET is_active = FALSE WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Product deactivated.');
    } catch (err) {
        console.error('Delete product error:', err);
        sendError(res, 'Failed to delete product.');
    }
}

// GET /api/products/:id/stock
async function getProductStock(req, res) {
    try {
        const [stock] = await pool.query(
            `SELECT sl.*, l.name as location_name, l.type as location_type,
              w.name as warehouse_name, w.code as warehouse_code
       FROM stock_levels sl
       JOIN locations l ON sl.location_id = l.id
       JOIN warehouses w ON l.warehouse_id = w.id
       WHERE sl.product_id = ?
       ORDER BY w.name, l.name`,
            [req.params.id]
        );
        sendSuccess(res, stock);
    } catch (err) {
        console.error('Get stock error:', err);
        sendError(res, 'Failed to fetch stock levels.');
    }
}

/**
 * Retrieves all product categories with their respective product counts.
 * @param {Request} req 
 * @param {Response} res 
 */
async function listCategories(req, res) {
    try {
        const [categories] = await pool.query(
            'SELECT c.*, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id ORDER BY c.name'
        );
        sendSuccess(res, categories);
    } catch (err) {
        console.error('List categories error:', err);
        sendError(res, 'Failed to fetch categories.');
    }
}

/**
 * Creates a new product category.
 * Validates category name uniqueness.
 * @param {Request} req 
 * @param {Response} res 
 */
async function createCategory(req, res) {
    try {
        const { name, description } = req.body;
        const [existing] = await pool.query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) return sendError(res, 'Category already exists.', 409);

        const [result] = await pool.query(
            'INSERT INTO categories (name, description) VALUES (?, ?)',
            [name, description || null]
        );
        sendSuccess(res, { id: result.insertId }, 'Category created.', 201);
    } catch (err) {
        console.error('Create category error:', err);
        sendError(res, 'Failed to create category.');
    }
}

module.exports = {
    listProducts, getProduct, createProduct, updateProduct, deleteProduct,
    getProductStock, listCategories, createCategory,
};
