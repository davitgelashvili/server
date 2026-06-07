'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const [[buyer]] = await pool.query(
            'SELECT id, name, personal_id, phone, email, notes, created_at FROM buyers WHERE id = ?',
            [id]
        );
        if (!buyer) return res.status(404).json({ success: false, message: 'Buyer not found' });

        const [[stats]] = await pool.query(`
            SELECT
                COUNT(t.ticket_id)        AS ticket_count,
                COALESCE(SUM(b.price), 0) AS total_spent,
                MIN(t.sold_at)            AS first_purchase,
                MAX(t.sold_at)            AS last_purchase
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            JOIN show_event e ON e.id = b.event_id
            JOIN show_hud   h ON h.id = e.hud_id
            WHERE t.buyer_id = ? AND h.user_id = ?
        `, [id, userId]);

        const [tickets] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at, t.platform,
                b.name  AS batch_name,
                b.price AS batch_price,
                e.title AS event_title,
                e.start_datetime AS event_date,
                h.title AS hud_title
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            JOIN show_event e ON e.id = b.event_id
            JOIN show_hud   h ON h.id = e.hud_id
            WHERE t.buyer_id = ? AND h.user_id = ?
            ORDER BY t.sold_at DESC
        `, [id, userId]);

        res.json({ success: true, buyer: { ...buyer, ...stats }, tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
