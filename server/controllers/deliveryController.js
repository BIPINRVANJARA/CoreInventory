const pool = require('../config/db');
const { sendSuccess, sendError, getPagination, generateReferenceNo } = require('../utils/helpers');

// GET /api/deliveries
async function listDeliveries(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { status, warehouse_id } = req.query;

        let where = ['1=1'];
        let params = [];

        if (status) { where.push('d.status = ?'); params.push(status); }
        if (warehouse_id) { where.push('d.warehouse_id = ?'); params.push(warehouse_id); }

        const whereClause = where.join(' AND ');
        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM delivery_orders d WHERE ${whereClause}`, params);

        const [deliveries] = await pool.query(
            `SELECT d.*, w.name as warehouse_name, u.name as created_by_name
       FROM delivery_orders d
       JOIN warehouses w ON d.warehouse_id = w.id
       JOIN users u ON d.created_by = u.id
       WHERE ${whereClause}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        sendSuccess(res, { deliveries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('List deliveries error:', err);
        sendError(res, 'Failed to fetch deliveries.');
    }
}

// GET /api/deliveries/:id
async function getDelivery(req, res) {
    try {
        const [deliveries] = await pool.query(
            `SELECT d.*, w.name as warehouse_name, u.name as created_by_name
       FROM delivery_orders d
       JOIN warehouses w ON d.warehouse_id = w.id
       JOIN users u ON d.created_by = u.id
       WHERE d.id = ?`, [req.params.id]
        );
        if (deliveries.length === 0) return sendError(res, 'Delivery not found.', 404);

        const [items] = await pool.query(
            `SELECT di.*, p.name as product_name, p.sku
       FROM delivery_items di JOIN products p ON di.product_id = p.id
       WHERE di.delivery_id = ?`, [req.params.id]
        );

        sendSuccess(res, { ...deliveries[0], items });
    } catch (err) {
        console.error('Get delivery error:', err);
        sendError(res, 'Failed to fetch delivery.');
    }
}

// POST /api/deliveries
async function createDelivery(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { customer_name, warehouse_id, notes, items } = req.body;

        if (!items || items.length === 0) return sendError(res, 'At least one item is required.', 422);

        const reference_no = generateReferenceNo('WH/OUT');

        const [result] = await conn.query(
            `INSERT INTO delivery_orders (reference_no, customer_name, warehouse_id, status, workflow_step, notes, created_by)
       VALUES (?, ?, ?, 'draft', 'pick', ?, ?)`,
            [reference_no, customer_name, warehouse_id, notes || null, req.user.id]
        );

        for (const item of items) {
            await conn.query(
                'INSERT INTO delivery_items (delivery_id, product_id, quantity) VALUES (?, ?, ?)',
                [result.insertId, item.product_id, item.quantity]
            );
        }

        await conn.commit();
        sendSuccess(res, { id: result.insertId, reference_no }, 'Delivery order created.', 201);
    } catch (err) {
        await conn.rollback();
        console.error('Create delivery error:', err);
        sendError(res, 'Failed to create delivery order.');
    } finally {
        conn.release();
    }
}

// PUT /api/deliveries/:id/step — advance workflow: pick → pack → validate
async function advanceStep(req, res) {
    try {
        const [deliveries] = await pool.query('SELECT * FROM delivery_orders WHERE id = ?', [req.params.id]);
        if (deliveries.length === 0) return sendError(res, 'Delivery not found.', 404);

        const delivery = deliveries[0];
        if (delivery.status === 'done') return sendError(res, 'Delivery already completed.', 400);
        if (delivery.status === 'canceled') return sendError(res, 'Cannot advance a canceled delivery.', 400);

        const stepMap = { pick: 'pack', pack: 'validate' };
        const nextStep = stepMap[delivery.workflow_step];

        if (!nextStep) return sendError(res, 'Delivery is ready for final validation.', 400);

        const statusMap = { pick: 'waiting', pack: 'ready' };
        const newStatus = statusMap[delivery.workflow_step] || delivery.status;

        await pool.query(
            'UPDATE delivery_orders SET workflow_step = ?, status = ? WHERE id = ?',
            [nextStep, newStatus, req.params.id]
        );

        sendSuccess(res, { workflow_step: nextStep, status: newStatus }, `Advanced to ${nextStep}.`);
    } catch (err) {
        console.error('Advance step error:', err);
        sendError(res, 'Failed to advance workflow step.');
    }
}

// PUT /api/deliveries/:id/validate
async function validateDelivery(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [deliveries] = await conn.query('SELECT * FROM delivery_orders WHERE id = ?', [req.params.id]);
        if (deliveries.length === 0) return sendError(res, 'Delivery not found.', 404);

        const delivery = deliveries[0];
        if (delivery.status === 'done') return sendError(res, 'Already validated.', 400);
        if (delivery.status === 'canceled') return sendError(res, 'Cannot validate canceled delivery.', 400);

        const [items] = await conn.query('SELECT * FROM delivery_items WHERE delivery_id = ?', [req.params.id]);

        // Verify stock availability and deduct
        for (const item of items) {
            const [stockRows] = await conn.query(
                `SELECT sl.id, sl.quantity, sl.location_id
         FROM stock_levels sl
         JOIN locations l ON sl.location_id = l.id
         WHERE sl.product_id = ? AND l.warehouse_id = ? AND sl.quantity >= ?
         ORDER BY sl.quantity DESC LIMIT 1`,
                [item.product_id, delivery.warehouse_id, item.quantity]
            );

            if (stockRows.length === 0) {
                await conn.rollback();
                const [product] = await pool.query('SELECT name FROM products WHERE id = ?', [item.product_id]);
                return sendError(res, `Insufficient stock for "${product[0]?.name || item.product_id}" (need ${item.quantity}).`, 400);
            }

            const stock = stockRows[0];

            // Deduct stock
            await conn.query('UPDATE stock_levels SET quantity = quantity - ? WHERE id = ?', [item.quantity, stock.id]);

            // Log to ledger
            await conn.query(
                `INSERT INTO stock_ledger (product_id, movement_type, from_location_id, qty_change, reference_no, created_by)
         VALUES (?, 'outgoing', ?, ?, ?, ?)`,
                [item.product_id, stock.location_id, -item.quantity, delivery.reference_no, req.user.id]
            );
        }

        await conn.query(
            "UPDATE delivery_orders SET status = 'done', workflow_step = 'validate', validated_at = NOW() WHERE id = ?",
            [req.params.id]
        );

        await conn.commit();
        sendSuccess(res, null, 'Delivery validated. Stock deducted.');
    } catch (err) {
        await conn.rollback();
        console.error('Validate delivery error:', err);
        sendError(res, 'Failed to validate delivery.');
    } finally {
        conn.release();
    }
}

module.exports = { listDeliveries, getDelivery, createDelivery, advanceStep, validateDelivery };
