'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [[client]] = await pool.query(
            'SELECT id, fullname, email, status, created_at FROM clients WHERE id = ?', [id]
        );
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

        const [[counts]] = await pool.query(`
            SELECT
                COUNT(DISTINCT h.id) AS totalHuds,
                COUNT(DISTINCT e.id) AS totalEvents,
                COUNT(DISTINCT b.id) AS totalBatches,
                COUNT(DISTINCT t.id) AS totalTickets,
                COALESCE(SUM(b.price), 0) AS totalRevenue
            FROM show_hud h
            LEFT JOIN show_event e ON e.hud_id   = h.id
            LEFT JOIN show_batch b ON b.event_id = e.id
            LEFT JOIN tickets    t ON t.batch_id = b.id
            WHERE h.user_id = ?
        `, [id]);

        const [recentTickets] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at,
                b.name  AS batch_name,
                b.price AS batch_price,
                e.title AS event_title,
                h.title AS hud_title
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            JOIN show_event e ON e.id = b.event_id
            JOIN show_hud   h ON h.id = e.hud_id
            WHERE h.user_id = ?
            ORDER BY t.sold_at DESC
            LIMIT 10
        `, [id]);

        res.json({ success: true, user: client, stats: counts, recentTickets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
