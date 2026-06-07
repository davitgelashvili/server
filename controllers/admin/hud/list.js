'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { user_id } = req.query;
        const where = user_id ? 'WHERE h.user_id = ?' : '';
        const params = user_id ? [user_id] : [];

        const [rows] = await pool.query(`
            SELECT
                h.id,
                h.title,
                h.slug,
                h.description,
                h.cover,
                h.start_datetime,
                h.end_datetime,
                h.status,
                h.requires_verification,
                h.max_tickets_per_buyer,
                DATEDIFF(h.end_datetime, h.start_datetime) + 1 AS duration_days,
                COUNT(DISTINCT e.id) AS event_count,
                COUNT(DISTINCT b.id) AS batch_count,
                (
                    SELECT MIN(b2.price) FROM show_batch b2
                    JOIN show_event e2 ON e2.id = b2.event_id
                    WHERE e2.hud_id = h.id
                      AND e2.start_datetime = (SELECT MIN(start_datetime) FROM show_event WHERE hud_id = h.id)
                ) AS first_day_min_price,
                (
                    SELECT MAX(b2.price) FROM show_batch b2
                    JOIN show_event e2 ON e2.id = b2.event_id
                    WHERE e2.hud_id = h.id
                      AND e2.start_datetime = (SELECT MAX(start_datetime) FROM show_event WHERE hud_id = h.id)
                ) AS last_day_max_price,
                u.id       AS owner_id,
                u.fullname AS owner_name,
                u.email    AS owner_email
            FROM show_hud h
            LEFT JOIN clients    u ON u.id        = h.user_id
            LEFT JOIN show_event e ON e.hud_id   = h.id
            LEFT JOIN show_batch b ON b.event_id = e.id
            ${where}
            GROUP BY h.id
            ORDER BY h.id DESC
        `, params);

        res.json({ success: true, items: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
