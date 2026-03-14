const pool = require('../config/db');
const { sendSuccess, sendError, getPagination, generateReferenceNo } = require('../utils/helpers');

// GET /api/receipts
async function listReceipts(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { status, warehouse_id } = req.query;

        let where = ['1=1'];
        let params = [];

        if (status === 'overdue') {
            where.push('r.payment_due_date < CURDATE() AND r.total_amount > r.paid_amount AND r.status != "canceled"');
        } else if (status) {
            where.push('r.status = ?'); params.push(status);
        }

        if (warehouse_id) { where.push('r.warehouse_id = ?'); params.push(warehouse_id); }

        const whereClause = where.join(' AND ');

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM receipts r WHERE ${whereClause}`, params
        );

        const [receipts] = await pool.query(
            `SELECT r.*, w.name as warehouse_name, u.name as created_by_name
       FROM receipts r
       JOIN warehouses w ON r.warehouse_id = w.id
       JOIN users u ON r.created_by = u.id
       WHERE ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        sendSuccess(res, { receipts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('List receipts error:', err);
        sendError(res, 'Failed to fetch receipts.');
    }
}

// GET /api/receipts/:id
async function getReceipt(req, res) {
    try {
        const [receipts] = await pool.query(
            `SELECT r.*, w.name as warehouse_name, u.name as created_by_name
       FROM receipts r
       JOIN warehouses w ON r.warehouse_id = w.id
       JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
            [req.params.id]
        );
        if (receipts.length === 0) return sendError(res, 'Receipt not found.', 404);

        const [items] = await pool.query(
            `SELECT ri.*, p.name as product_name, p.sku
       FROM receipt_items ri
       JOIN products p ON ri.product_id = p.id
       WHERE ri.receipt_id = ?`,
            [req.params.id]
        );

        sendSuccess(res, { ...receipts[0], items });
    } catch (err) {
        console.error('Get receipt error:', err);
        sendError(res, 'Failed to fetch receipt.');
    }
}

// POST /api/receipts
async function createReceipt(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            supplier_name, warehouse_id, notes, items,
            is_order, total_amount, paid_amount, payment_status, payment_due_date
        } = req.body;

        if (!items || items.length === 0) {
            return sendError(res, 'At least one item is required.', 422);
        }

        const reference_no = generateReferenceNo('WH/IN');

        const [result] = await conn.query(
            `INSERT INTO receipts (
                reference_no, supplier_name, warehouse_id, status, notes, created_by,
                is_order, total_amount, paid_amount, payment_status, payment_due_date
            ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)`,
            [
                reference_no, supplier_name, warehouse_id, notes || null, req.user.id,
                is_order ? 1 : 0,
                total_amount || 0.00,
                paid_amount || 0.00,
                payment_status || 'pending',
                payment_due_date || null
            ]
        );

        for (const item of items) {
            await conn.query(
                'INSERT INTO receipt_items (receipt_id, product_id, quantity) VALUES (?, ?, ?)',
                [result.insertId, item.product_id, item.quantity]
            );
        }

        await conn.commit();
        sendSuccess(res, { id: result.insertId, reference_no }, 'Receipt created.', 201);
    } catch (err) {
        await conn.rollback();
        console.error('Create receipt error:', err);
        sendError(res, 'Failed to create receipt.');
    } finally {
        conn.release();
    }
}

// PUT /api/receipts/:id/validate
async function validateReceipt(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [receipts] = await conn.query('SELECT * FROM receipts WHERE id = ?', [req.params.id]);
        if (receipts.length === 0) return sendError(res, 'Receipt not found.', 404);

        const receipt = receipts[0];
        if (receipt.status === 'done') return sendError(res, 'Receipt already validated.', 400);
        if (receipt.status === 'canceled') return sendError(res, 'Cannot validate a canceled receipt.', 400);

        // Get items
        const [items] = await conn.query('SELECT * FROM receipt_items WHERE receipt_id = ?', [req.params.id]);

        // Get the first location in the warehouse to receive stock
        const [locations] = await conn.query(
            'SELECT id FROM locations WHERE warehouse_id = ? ORDER BY id LIMIT 1',
            [receipt.warehouse_id]
        );

        if (locations.length === 0) {
            return sendError(res, 'No location found in this warehouse. Create a location first.', 400);
        }

        const locationId = locations[0].id;

        // Update stock levels and log to ledger
        for (const item of items) {
            // Upsert stock level
            await conn.query(
                `INSERT INTO stock_levels (product_id, location_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                [item.product_id, locationId, item.quantity]
            );

            // Log to stock ledger
            await conn.query(
                `INSERT INTO stock_ledger (product_id, movement_type, to_location_id, qty_change, reference_no, created_by)
         VALUES (?, 'incoming', ?, ?, ?, ?)`,
                [item.product_id, locationId, item.quantity, receipt.reference_no, req.user.id]
            );
        }

        // Update receipt status
        await conn.query(
            "UPDATE receipts SET status = 'done', validated_at = NOW() WHERE id = ?",
            [req.params.id]
        );

        await conn.commit();
        sendSuccess(res, null, 'Receipt validated. Stock updated.');
    } catch (err) {
        await conn.rollback();
        console.error('Validate receipt error:', err);
        sendError(res, 'Failed to validate receipt.');
    } finally {
        conn.release();
    }
}

// PUT /api/receipts/:id/cancel
async function cancelReceipt(req, res) {
    try {
        const [receipts] = await pool.query('SELECT status FROM receipts WHERE id = ?', [req.params.id]);
        if (receipts.length === 0) return sendError(res, 'Receipt not found.', 404);
        if (receipts[0].status === 'done') return sendError(res, 'Cannot cancel a validated receipt.', 400);

        await pool.query("UPDATE receipts SET status = 'canceled' WHERE id = ?", [req.params.id]);
        sendSuccess(res, null, 'Receipt canceled.');
    } catch (err) {
        console.error('Cancel receipt error:', err);
        sendError(res, 'Failed to cancel receipt.');
    }
}

module.exports = { listReceipts, getReceipt, createReceipt, validateReceipt, cancelReceipt };
