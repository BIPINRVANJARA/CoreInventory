const pool = require('../config/db');
const { sendSuccess, sendError, getPagination, generateReferenceNo } = require('../utils/helpers');

// GET /api/transfers
async function listTransfers(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { status } = req.query;

        let where = ['1=1'];
        let params = [];
        if (status) { where.push('t.status = ?'); params.push(status); }

        const whereClause = where.join(' AND ');
        const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM internal_transfers t WHERE ${whereClause}`, params);

        const [transfers] = await pool.query(
            `SELECT t.*,
              fl.name as from_location_name, fw.name as from_warehouse_name,
              tl.name as to_location_name, tw.name as to_warehouse_name,
              u.name as created_by_name
       FROM internal_transfers t
       JOIN locations fl ON t.from_location_id = fl.id
       JOIN warehouses fw ON fl.warehouse_id = fw.id
       JOIN locations tl ON t.to_location_id = tl.id
       JOIN warehouses tw ON tl.warehouse_id = tw.id
       JOIN users u ON t.created_by = u.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        sendSuccess(res, { transfers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('List transfers error:', err);
        sendError(res, 'Failed to fetch transfers.');
    }
}

// GET /api/transfers/:id
async function getTransfer(req, res) {
    try {
        const [transfers] = await pool.query(
            `SELECT t.*,
              fl.name as from_location_name, fw.name as from_warehouse_name,
              tl.name as to_location_name, tw.name as to_warehouse_name,
              u.name as created_by_name
       FROM internal_transfers t
       JOIN locations fl ON t.from_location_id = fl.id
       JOIN warehouses fw ON fl.warehouse_id = fw.id
       JOIN locations tl ON t.to_location_id = tl.id
       JOIN warehouses tw ON tl.warehouse_id = tw.id
       JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`, [req.params.id]
        );
        if (transfers.length === 0) return sendError(res, 'Transfer not found.', 404);

        const [items] = await pool.query(
            `SELECT ti.*, p.name as product_name, p.sku
       FROM transfer_items ti JOIN products p ON ti.product_id = p.id
       WHERE ti.transfer_id = ?`, [req.params.id]
        );

        sendSuccess(res, { ...transfers[0], items });
    } catch (err) {
        console.error('Get transfer error:', err);
        sendError(res, 'Failed to fetch transfer.');
    }
}

// POST /api/transfers
async function createTransfer(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { from_location_id, to_location_id, notes, items } = req.body;

        if (!items || items.length === 0) return sendError(res, 'At least one item is required.', 422);
        if (from_location_id === to_location_id) return sendError(res, 'Source and destination cannot be the same.', 422);

        const reference_no = generateReferenceNo('WH/INT');

        const [result] = await conn.query(
            `INSERT INTO internal_transfers (reference_no, from_location_id, to_location_id, status, notes, created_by)
       VALUES (?, ?, ?, 'draft', ?, ?)`,
            [reference_no, from_location_id, to_location_id, notes || null, req.user.id]
        );

        for (const item of items) {
            await conn.query(
                'INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)',
                [result.insertId, item.product_id, item.quantity]
            );
        }

        await conn.commit();
        sendSuccess(res, { id: result.insertId, reference_no }, 'Transfer created.', 201);
    } catch (err) {
        await conn.rollback();
        console.error('Create transfer error:', err);
        sendError(res, 'Failed to create transfer.');
    } finally {
        conn.release();
    }
}

// PUT /api/transfers/:id/validate
async function validateTransfer(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [transfers] = await conn.query('SELECT * FROM internal_transfers WHERE id = ?', [req.params.id]);
        if (transfers.length === 0) return sendError(res, 'Transfer not found.', 404);

        const transfer = transfers[0];
        if (transfer.status === 'done') return sendError(res, 'Already validated.', 400);
        if (transfer.status === 'canceled') return sendError(res, 'Cannot validate canceled transfer.', 400);

        const [items] = await conn.query('SELECT * FROM transfer_items WHERE transfer_id = ?', [req.params.id]);

        for (const item of items) {
            // Check source stock
            const [stockRows] = await conn.query(
                'SELECT id, quantity FROM stock_levels WHERE product_id = ? AND location_id = ?',
                [item.product_id, transfer.from_location_id]
            );

            if (stockRows.length === 0 || stockRows[0].quantity < item.quantity) {
                await conn.rollback();
                const [product] = await pool.query('SELECT name FROM products WHERE id = ?', [item.product_id]);
                return sendError(res, `Insufficient stock for "${product[0]?.name}" at source location.`, 400);
            }

            // Deduct from source
            await conn.query(
                'UPDATE stock_levels SET quantity = quantity - ? WHERE product_id = ? AND location_id = ?',
                [item.quantity, item.product_id, transfer.from_location_id]
            );

            // Add to destination (upsert)
            await conn.query(
                `INSERT INTO stock_levels (product_id, location_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)`,
                [item.product_id, transfer.to_location_id, item.quantity]
            );

            // Log ledger - transfer out
            await conn.query(
                `INSERT INTO stock_ledger (product_id, movement_type, from_location_id, qty_change, reference_no, created_by)
         VALUES (?, 'transfer_out', ?, ?, ?, ?)`,
                [item.product_id, transfer.from_location_id, -item.quantity, transfer.reference_no, req.user.id]
            );

            // Log ledger - transfer in
            await conn.query(
                `INSERT INTO stock_ledger (product_id, movement_type, to_location_id, qty_change, reference_no, created_by)
         VALUES (?, 'transfer_in', ?, ?, ?, ?)`,
                [item.product_id, transfer.to_location_id, item.quantity, transfer.reference_no, req.user.id]
            );
        }

        await conn.query("UPDATE internal_transfers SET status = 'done', validated_at = NOW() WHERE id = ?", [req.params.id]);

        await conn.commit();
        sendSuccess(res, null, 'Transfer validated. Stock moved.');
    } catch (err) {
        await conn.rollback();
        console.error('Validate transfer error:', err);
        sendError(res, 'Failed to validate transfer.');
    } finally {
        conn.release();
    }
}

module.exports = { listTransfers, getTransfer, createTransfer, validateTransfer };
