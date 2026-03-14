const pool = require('../config/db');
const { sendSuccess, sendError, getPagination } = require('../utils/helpers');

/**
 * Retrieves a filtered, paginated list of stock movements (ledger entries).
 * Supports filtering by product, category, movement type, and date range.
 * @param {Request} req 
 * @param {Response} res 
 */
async function listLedger(req, res) {
    try {
        const { page, limit, offset } = getPagination(req.query);
        const { product_id, movement_type, start_date, end_date } = req.query;

        let where = ['1=1'];
        let params = [];

        if (product_id) { where.push('sl.product_id = ?'); params.push(product_id); }
        if (movement_type) { where.push('sl.movement_type = ?'); params.push(movement_type); }
        if (start_date) { where.push('sl.created_at >= ?'); params.push(start_date); }
        if (end_date) { where.push('sl.created_at <= ?'); params.push(end_date + ' 23:59:59'); }

        const whereClause = where.join(' AND ');

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) as total FROM stock_ledger sl WHERE ${whereClause}`, params
        );

        const [entries] = await pool.query(
            `SELECT sl.*,
              p.name as product_name, p.sku,
              fl.name as from_location_name, tl.name as to_location_name,
              u.name as created_by_name
       FROM stock_ledger sl
       JOIN products p ON sl.product_id = p.id
       LEFT JOIN locations fl ON sl.from_location_id = fl.id
       LEFT JOIN locations tl ON sl.to_location_id = tl.id
       JOIN users u ON sl.created_by = u.id
       WHERE ${whereClause}
       ORDER BY sl.created_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        sendSuccess(res, { entries, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
    } catch (err) {
        console.error('List ledger error:', err);
        sendError(res, 'Failed to fetch ledger.');
    }
}

/**
 * Exports the stock ledger as a CSV file.
 * Applies the same filters as the listLedger function.
 * @param {Request} req 
 * @param {Response} res 
 */
async function exportLedger(req, res) {
    try {
        const { product_id, movement_type, start_date, end_date } = req.query;

        let where = ['1=1'];
        let params = [];

        if (product_id) { where.push('sl.product_id = ?'); params.push(product_id); }
        if (movement_type) { where.push('sl.movement_type = ?'); params.push(movement_type); }
        if (start_date) { where.push('sl.created_at >= ?'); params.push(start_date); }
        if (end_date) { where.push('sl.created_at <= ?'); params.push(end_date + ' 23:59:59'); }

        const [entries] = await pool.query(
            `SELECT sl.id, p.name as product_name, p.sku, sl.movement_type,
              fl.name as from_location, tl.name as to_location,
              sl.qty_change, sl.reference_no, sl.notes,
              u.name as created_by, sl.created_at
       FROM stock_ledger sl
       JOIN products p ON sl.product_id = p.id
       LEFT JOIN locations fl ON sl.from_location_id = fl.id
       LEFT JOIN locations tl ON sl.to_location_id = tl.id
       JOIN users u ON sl.created_by = u.id
       WHERE ${where.join(' AND ')}
       ORDER BY sl.created_at DESC`,
            params
        );

        // Build CSV
        const headers = ['ID', 'Product', 'SKU', 'Type', 'From Location', 'To Location', 'Qty Change', 'Reference', 'Notes', 'Created By', 'Date'];
        const rows = entries.map(e => [
            e.id, `"${e.product_name}"`, e.sku, e.movement_type,
            e.from_location || '', e.to_location || '',
            e.qty_change, e.reference_no, `"${e.notes || ''}"`,
            e.created_by, e.created_at
        ].join(','));

        const csv = [headers.join(','), ...rows].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=stock_ledger_export.csv');
        res.send(csv);
    } catch (err) {
        console.error('Export ledger error:', err);
        sendError(res, 'Failed to export ledger.');
    }
}

module.exports = { listLedger, exportLedger };
