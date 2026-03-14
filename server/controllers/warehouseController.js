const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// GET /api/warehouses
async function listWarehouses(req, res) {
    try {
        const [warehouses] = await pool.query(
            `SELECT w.*, COUNT(l.id) as location_count
       FROM warehouses w
       LEFT JOIN locations l ON w.id = l.warehouse_id
       GROUP BY w.id
       ORDER BY w.name`
        );
        sendSuccess(res, warehouses);
    } catch (err) {
        console.error('List warehouses error:', err);
        sendError(res, 'Failed to fetch warehouses.');
    }
}

// GET /api/warehouses/:id
async function getWarehouse(req, res) {
    try {
        const [warehouses] = await pool.query('SELECT * FROM warehouses WHERE id = ?', [req.params.id]);
        if (warehouses.length === 0) return sendError(res, 'Warehouse not found.', 404);

        const [locations] = await pool.query(
            'SELECT * FROM locations WHERE warehouse_id = ? ORDER BY name',
            [req.params.id]
        );

        sendSuccess(res, { ...warehouses[0], locations });
    } catch (err) {
        console.error('Get warehouse error:', err);
        sendError(res, 'Failed to fetch warehouse.');
    }
}

// POST /api/warehouses
async function createWarehouse(req, res) {
    try {
        const { name, code, address } = req.body;

        const [existing] = await pool.query('SELECT id FROM warehouses WHERE code = ?', [code]);
        if (existing.length > 0) return sendError(res, 'Warehouse code already exists.', 409);

        const [result] = await pool.query(
            'INSERT INTO warehouses (name, code, address) VALUES (?, ?, ?)',
            [name, code, address || null]
        );
        sendSuccess(res, { id: result.insertId }, 'Warehouse created.', 201);
    } catch (err) {
        console.error('Create warehouse error:', err);
        sendError(res, 'Failed to create warehouse.');
    }
}

// PUT /api/warehouses/:id
async function updateWarehouse(req, res) {
    try {
        const { name, code, address, is_active } = req.body;
        await pool.query(
            `UPDATE warehouses SET name = COALESCE(?, name), code = COALESCE(?, code),
       address = COALESCE(?, address), is_active = COALESCE(?, is_active)
       WHERE id = ?`,
            [name, code, address, is_active, req.params.id]
        );
        sendSuccess(res, null, 'Warehouse updated.');
    } catch (err) {
        console.error('Update warehouse error:', err);
        sendError(res, 'Failed to update warehouse.');
    }
}

// GET /api/locations
async function listLocations(req, res) {
    try {
        const { warehouse_id } = req.query;
        let query = `SELECT l.*, w.name as warehouse_name, w.code as warehouse_code
                 FROM locations l JOIN warehouses w ON l.warehouse_id = w.id`;
        const params = [];

        if (warehouse_id) {
            query += ' WHERE l.warehouse_id = ?';
            params.push(warehouse_id);
        }
        query += ' ORDER BY w.name, l.name';

        const [locations] = await pool.query(query, params);
        sendSuccess(res, locations);
    } catch (err) {
        console.error('List locations error:', err);
        sendError(res, 'Failed to fetch locations.');
    }
}

// POST /api/locations
async function createLocation(req, res) {
    try {
        const { warehouse_id, name, type } = req.body;

        const [result] = await pool.query(
            'INSERT INTO locations (warehouse_id, name, type) VALUES (?, ?, ?)',
            [warehouse_id, name, type || 'rack']
        );
        sendSuccess(res, { id: result.insertId }, 'Location created.', 201);
    } catch (err) {
        console.error('Create location error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return sendError(res, 'Location name already exists in this warehouse.', 409);
        }
        sendError(res, 'Failed to create location.');
    }
}

// DELETE /api/locations/:id
async function deleteLocation(req, res) {
    try {
        const [stock] = await pool.query('SELECT id FROM stock_levels WHERE location_id = ? AND quantity > 0', [req.params.id]);
        if (stock.length > 0) {
            return sendError(res, 'Cannot delete location with existing stock. Move stock first.', 400);
        }
        await pool.query('DELETE FROM locations WHERE id = ?', [req.params.id]);
        sendSuccess(res, null, 'Location deleted.');
    } catch (err) {
        console.error('Delete location error:', err);
        sendError(res, 'Failed to delete location.');
    }
}

// PUT /api/locations/:id
async function updateLocation(req, res) {
    try {
        const { name, type } = req.body;

        await pool.query(
            'UPDATE locations SET name = COALESCE(?, name), type = COALESCE(?, type) WHERE id = ?',
            [name, type, req.params.id]
        );
        sendSuccess(res, null, 'Location updated.');
    } catch (err) {
        console.error('Update location error:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return sendError(res, 'Location name already exists in this warehouse.', 409);
        }
        sendError(res, 'Failed to update location.');
    }
}

module.exports = {
    listWarehouses, getWarehouse, createWarehouse, updateWarehouse,
    listLocations, createLocation, deleteLocation, updateLocation
};
