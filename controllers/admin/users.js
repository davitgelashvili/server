'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                c.id          AS user_id,
                c.email,
                c.fullname,
                c.status,
                c.created_at,
                COUNT(DISTINCT h.id) AS hud_count,
                COUNT(DISTINCT e.id) AS event_count,
                COUNT(DISTINCT b.id) AS batch_count,
                COUNT(DISTINCT t.id) AS ticket_count,
                COALESCE(SUM(b.price), 0) AS revenue
            FROM clients c
            LEFT JOIN show_hud   h ON h.user_id  = c.id
            LEFT JOIN show_event e ON e.hud_id   = h.id
            LEFT JOIN show_batch b ON b.event_id = e.id
            LEFT JOIN tickets    t ON t.batch_id = b.id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);

        res.json({ success: true, users: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
