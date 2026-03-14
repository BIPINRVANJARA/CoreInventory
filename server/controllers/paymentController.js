const pool = require('../config/db');
const { sendSuccess, sendError } = require('../utils/helpers');

// GET /api/payments/summary
async function getPaymentSummary(req, res) {
    try {
        const [summary] = await pool.query(`
            SELECT 
                SUM(total_amount) as total_sales,
                SUM(paid_amount) as total_paid,
                SUM(CASE WHEN total_amount > paid_amount THEN total_amount - paid_amount ELSE 0 END) as total_pending,
                SUM(CASE WHEN payment_due_date < CURDATE() AND total_amount > paid_amount THEN total_amount - paid_amount ELSE 0 END) as total_overdue
            FROM receipts 
            WHERE is_order = TRUE AND status != 'canceled'
        `);

        const [recentPayments] = await pool.query(`
            SELECT ph.*, r.reference_no, r.supplier_name
            FROM payment_history ph
            JOIN receipts r ON ph.receipt_id = r.id
            ORDER BY ph.payment_date DESC
            LIMIT 5
        `);

        sendSuccess(res, {
            metrics: summary[0] || { total_sales: 0, total_paid: 0, total_pending: 0, total_overdue: 0 },
            recentPayments
        });
    } catch (err) {
        console.error('Payment summary error:', err);
        sendError(res, 'Failed to fetch payment summary.');
    }
}

// POST /api/payments/:receiptId
async function recordPayment(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { receiptId } = req.params;
        const { amount, payment_method, notes } = req.body;

        if (!amount || amount <= 0) return sendError(res, 'Valid amount is required.', 422);

        // Update receipt
        const [result] = await conn.query(
            "UPDATE receipts SET paid_amount = paid_amount + ? WHERE id = ?",
            [amount, receiptId]
        );

        if (result.affectedRows === 0) {
            await conn.rollback();
            return sendError(res, 'Receipt not found.', 404);
        }

        // Add history log
        await conn.query(
            "INSERT INTO payment_history (receipt_id, amount, payment_method, notes) VALUES (?, ?, ?, ?)",
            [receiptId, amount, payment_method || 'other', notes || null]
        );

        await conn.commit();
        sendSuccess(res, null, 'Payment recorded successfully.');
    } catch (err) {
        await conn.rollback();
        console.error('Record payment error:', err);
        sendError(res, 'Failed to record payment.');
    } finally {
        conn.release();
    }
}

module.exports = { getPaymentSummary, recordPayment };
