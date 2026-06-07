'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { status, hud_id, search, from_date, to_date, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const conditions = [];
        const params = [];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (hud_id) {
            conditions.push('h.id = ?');
            params.push(hud_id);
        }
        if (search) {
            conditions.push('(t.ticket_id LIKE ? OR u.fullname LIKE ? OR h.title LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (from_date) {
            conditions.push('t.sold_at >= ?');
            params.push(from_date);
        }
        if (to_date) {
            conditions.push('t.sold_at <= ?');
            params.push(to_date + ' 23:59:59');
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM tickets t
             JOIN show_batch  b ON b.id = t.batch_id
             JOIN show_event  e ON e.id = b.event_id
             JOIN show_hud    h ON h.id = e.hud_id
             LEFT JOIN clients u ON u.id = h.user_id
             ${where}`, params
        );

        const [rows] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at, t.buyer_id, t.platform,
                b.name      AS batch_name,
                b.price     AS batch_price,
                e.title     AS event_title,
                e.start_datetime AS event_date,
                h.id        AS hud_id,
                h.title     AS hud_title,
                u.id        AS owner_id,
                u.fullname  AS owner_name,
                u.email     AS owner_email
            FROM tickets t
            JOIN show_batch  b ON b.id       = t.batch_id
            JOIN show_event  e ON e.id       = b.event_id
            JOIN show_hud    h ON h.id       = e.hud_id
            LEFT JOIN clients u ON u.id       = h.user_id
            ${where}
            ORDER BY t.sold_at DESC
            LIMIT ? OFFSET ?
        `, [...params, Number(limit), offset]);

        res.json({ success: true, tickets: rows, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
