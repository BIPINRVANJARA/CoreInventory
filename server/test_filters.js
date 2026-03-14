require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'core_inventory',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    try {
        const type = 'All';
        const warehouse_id = '1';
        const status = 'All';

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
                    CONCAT(fl.name, ' -> ', tl.name) as warehouse_name, t.from_location_id as warehouse_id,
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

        if (conditions.length > 0) {
            combinedQuery += ` WHERE ` + conditions.join(' AND ');
        }

        console.log("Q1", combinedQuery);
        console.log("Params1", params);

        const countQuery = `SELECT COUNT(*) as cnt FROM (${combinedQuery}) as q`;
        const [[{ cnt }]] = await pool.query(countQuery, params);
        console.log("Count:", cnt);

        combinedQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(10, 0);

        console.log("Q2", combinedQuery);
        console.log("Params2", params);
        const [operations] = await pool.query(combinedQuery, params);

        console.log("Operations:", operations);
    } catch (e) {
        console.error("SQL Error", e);
    }
    process.exit(0);
}
run();
