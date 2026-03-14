const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// GET /api/dashboard/kpis
async function getKPIs(req, res) {
    try {
        // Parse date filter if provided, default to today for operations
        const today = new Date().toISOString().split('T')[0];

        // Total active products
        const [[{ totalProducts }]] = await pool.query(
            'SELECT COUNT(*) as totalProducts FROM products WHERE is_active = TRUE'
        );

        // Products with total stock
        const [stockData] = await pool.query(
            `SELECT p.id, COALESCE(SUM(sl.quantity), 0) as total_stock, p.reorder_point
       FROM products p
       LEFT JOIN stock_levels sl ON p.id = sl.product_id
       WHERE p.is_active = TRUE
       GROUP BY p.id`
        );

        const lowStock = stockData.filter(p => p.total_stock > 0 && p.total_stock <= p.reorder_point).length;
        const outOfStock = stockData.filter(p => p.total_stock === 0).length;

        // Receipts: count of 'draft' or 'waiting' or 'ready'
        const [[{ receiptsToReceive }]] = await pool.query(
            "SELECT COUNT(*) as cnt FROM receipts WHERE status != 'done' AND status != 'canceled'"
        );

        // Deliveries breakdown
        const [[{ deliveryReady }]] = await pool.query(
            "SELECT COUNT(*) as cnt FROM delivery_orders WHERE status = 'ready' OR workflow_step = 'validate'"
        );
        const [[{ deliveryWaiting }]] = await pool.query(
            "SELECT COUNT(*) as cnt FROM delivery_orders WHERE status = 'waiting' OR workflow_step = 'pack'"
        );
        const [[{ deliveryOperations }]] = await pool.query(
            "SELECT COUNT(*) as cnt FROM delivery_orders WHERE status != 'done' AND status != 'canceled'"
        );

        // Recent operations (today by default)
        const [recentOps] = await pool.query(`
      SELECT * FROM (
        (SELECT r.id, r.reference_no, 'Receipt' as type, r.status, r.created_at, w.name as warehouse_name,
                GROUP_CONCAT(p.name SEPARATOR ', ') as products, SUM(ri.quantity) as total_qty
         FROM receipts r
         JOIN warehouses w ON r.warehouse_id = w.id
         JOIN receipt_items ri ON r.id = ri.receipt_id
         JOIN products p ON ri.product_id = p.id
         WHERE DATE(r.created_at) = ?
         GROUP BY r.id)
        UNION ALL
        (SELECT d.id, d.reference_no, 'Delivery' as type, d.status, d.created_at, w.name as warehouse_name,
                GROUP_CONCAT(p.name SEPARATOR ', ') as products, SUM(di.quantity) as total_qty
         FROM delivery_orders d
         JOIN warehouses w ON d.warehouse_id = w.id
         JOIN delivery_items di ON d.id = di.delivery_id
         JOIN products p ON di.product_id = p.id
         WHERE DATE(d.created_at) = ?
         GROUP BY d.id)
      ) AS combined_ops
      ORDER BY created_at DESC LIMIT 20
    `, [today, today]);

        sendSuccess(res, {
            today,
            totalProducts,
            lowStock,
            outOfStock,
            receipts: {
                toReceive: receiptsToReceive
            },
            deliveries: {
                ready: deliveryReady,
                waiting: deliveryWaiting,
                totalPending: deliveryOperations
            },
            recentOperations: recentOps
        });
    } catch (err) {
        console.error('Dashboard KPIs error:', err);
    }
}

// GET /api/dashboard/operations
async function getOperations(req, res) {
    try {
        const { type = 'All', warehouse_id = 'All', status = 'All', page = 1, limit = 10 } = req.query;
        let pLimit = parseInt(limit) || 10;
        let pOffset = (parseInt(page) - 1 || 0) * pLimit;

        let combinedQuery = `
          SELECT * FROM (
            (SELECT r.id, r.reference_no, 'Receipt' as type, r.status, r.created_at, w.name as warehouse_name, w.id as warehouse_id,
                    GROUP_CONCAT(p.name SEPARATOR ', ') as products, SUM(ri.quantity) as total_qty
             FROM receipts r
             JOIN warehouses w ON r.warehouse_id = w.id
             JOIN receipt_items ri ON r.id = ri.receipt_id
             JOIN products p ON ri.product_id = p.id
             GROUP BY r.id)
            UNION ALL
            (SELECT d.id, d.reference_no, 'Delivery' as type, d.status, d.created_at, w.name as warehouse_name, w.id as warehouse_id,
                    GROUP_CONCAT(p.name SEPARATOR ', ') as products, SUM(di.quantity) as total_qty
             FROM delivery_orders d
             JOIN warehouses w ON d.warehouse_id = w.id
             JOIN delivery_items di ON d.id = di.delivery_id
             JOIN products p ON di.product_id = p.id
             GROUP BY d.id)
            UNION ALL
            (SELECT t.id, t.reference_no, 'Internal' as type, t.status, t.created_at,
                    CONCAT(fl.name, ' -> ', tl.name) as warehouse_name, fl.warehouse_id as warehouse_id,
                    GROUP_CONCAT(p.name SEPARATOR ', ') as products, SUM(ti.quantity) as total_qty
             FROM internal_transfers t
             JOIN locations fl ON t.from_location_id = fl.id
             JOIN locations tl ON t.to_location_id = tl.id
             JOIN transfer_items ti ON t.id = ti.transfer_id
             JOIN products p ON ti.product_id = p.id
             GROUP BY t.id)
          ) AS combined_ops
        `;

        let conditions = [];
        let params = [];

        if (type !== 'All Types' && type !== 'All') {
            conditions.push(`type = ?`);
            params.push(type);
        }
        if (warehouse_id !== 'All' && warehouse_id !== '') {
            conditions.push(`warehouse_id = ?`);
            params.push(warehouse_id);
        }
        if (status !== 'All') {
            conditions.push(`status = ?`);
            params.push(status.toLowerCase());
        }
        if (req.query.search) {
            conditions.push(`(reference_no LIKE ? OR products LIKE ? OR warehouse_name LIKE ?)`);
            const searchTerm = `%${req.query.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (conditions.length > 0) {
            combinedQuery += ` WHERE ` + conditions.join(' AND ');
        }

        const countQuery = `SELECT COUNT(*) as cnt FROM (${combinedQuery}) as q`;
        const [[{ cnt }]] = await pool.query(countQuery, params);

        combinedQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(pLimit, pOffset);

        const [operations] = await pool.query(combinedQuery, params);

        sendSuccess(res, {
            operations,
            totalCount: cnt,
            page: parseInt(page),
            limit: pLimit
        });
    } catch (err) {
        console.error('Operations error:', err);
        sendError(res, 'Failed to fetch operations.');
    }
}

module.exports = { getKPIs, getOperations };
