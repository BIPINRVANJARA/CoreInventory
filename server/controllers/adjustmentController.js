const pool = require('../config/db');
const { sendSuccess, sendError, getPagination, generateReferenceNo } = require('../utils/helpers');

/**
 * Retrieves a paginated list of all manual stock adjustments.
 * @param {Request} req 
 * @param {Response} res 
 */
async function listAdjustments(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);

        const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM stock_adjustments');

        const [adjustments] = await pool.query(
            `SELECT sa.*, p.name as product_name, p.sku,
              l.name as location_name, w.name as warehouse_name,
              u.name as created_by_name
       FROM stock_adjustments sa
       JOIN products p ON sa.product_id = p.id
       JOIN locations l ON sa.location_id = l.id
       JOIN warehouses w ON l.warehouse_id = w.id
       JOIN users u ON sa.created_by = u.id
       ORDER BY sa.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        sendSuccess(res, { adjustments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('List adjustments error:', err);
        sendError(res, 'Failed to fetch adjustments.');
    }
}

/**
 * Records a new stock adjustment, updates the physical stock levels,
 * and creates a corresponding entry in the stock ledger.
 * @param {Request} req 
 * @param {Response} res 
 */
async function createAdjustment(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { product_id, location_id, physical_qty, reason, notes } = req.body;

        // Get current recorded quantity
        const [stockRows] = await conn.query(
            'SELECT quantity FROM stock_levels WHERE product_id = ? AND location_id = ?',
            [product_id, location_id]
        );

        const recorded_qty = stockRows.length > 0 ? stockRows[0].quantity : 0;
        const difference = physical_qty - recorded_qty;
        const reference_no = generateReferenceNo('WH/ADJ');

        // Insert adjustment record
        await conn.query(
            `INSERT INTO stock_adjustments (reference_no, product_id, location_id, recorded_qty, physical_qty, reason, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [reference_no, product_id, location_id, recorded_qty, physical_qty, reason || 'recount', notes || null, req.user.id]
        );

        // Update stock level to physical count
        if (stockRows.length > 0) {
            await conn.query(
                'UPDATE stock_levels SET quantity = ? WHERE product_id = ? AND location_id = ?',
                [physical_qty, product_id, location_id]
            );
        } else {
            await conn.query(
                'INSERT INTO stock_levels (product_id, location_id, quantity) VALUES (?, ?, ?)',
                [product_id, location_id, physical_qty]
            );
        }

        // Log to ledger
        await conn.query(
            `INSERT INTO stock_ledger (product_id, movement_type, to_location_id, qty_change, reference_no, notes, created_by)
       VALUES (?, 'adjustment', ?, ?, ?, ?, ?)`,
            [product_id, location_id, difference, reference_no, `Adjustment: ${reason || 'recount'}. ${notes || ''}`.trim(), req.user.id]
        );

        await conn.commit();
        sendSuccess(res, { reference_no, recorded_qty, physical_qty, difference }, 'Stock adjustment recorded.', 201);
    } catch (err) {
        await conn.rollback();
        console.error('Create adjustment error:', err);
        sendError(res, 'Failed to create adjustment.');
    } finally {
        conn.release();
    }
}

module.exports = { listAdjustments, createAdjustment };
