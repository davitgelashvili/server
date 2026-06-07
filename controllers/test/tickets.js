'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.params;

        const [tickets] = await pool.query(`
            SELECT
                t.ticket_id  AS ticketId,
                t.amount     AS price,
                t.sold_at    AS purchasedAt,
                t.status,
                b.name       AS batchName,
                e.title      AS eventName,
                e.start_datetime AS eventDate,
                h.title      AS showName,
                h.cover      AS showCover
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            JOIN show_event e ON e.id = t.event_id
            JOIN show_hud   h ON h.id = e.hud_id
            WHERE t.buyer_id = ? AND t.platform = 'test'
            ORDER BY t.sold_at DESC
        `, [userId]);

        res.json({ success: true, tickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
