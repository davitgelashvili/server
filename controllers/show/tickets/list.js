'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { status, search, from_date, to_date, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const conditions = ['h.user_id = ?'];
        const params     = [userId];

        if (status) {
            conditions.push('t.status = ?');
            params.push(status);
        }
        if (search) {
            conditions.push('(t.ticket_id LIKE ? OR h.title LIKE ?)');
            const like = `%${search}%`;
            params.push(like, like);
        }
        if (from_date) {
            conditions.push('t.sold_at >= ?');
            params.push(from_date);
        }
        if (to_date) {
            conditions.push('t.sold_at <= ?');
            params.push(to_date + ' 23:59:59');
        }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM tickets t
             JOIN show_batch b ON t.batch_id = b.id
             JOIN show_event e ON b.event_id = e.id
             JOIN show_hud   h ON e.hud_id   = h.id
             ${where}`, params
        );

        const [rows] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at, t.buyer_id, t.platform,
                b.name  AS batch_name,
                b.price AS batch_price,
                e.title AS event_title,
                h.title AS hud_title
            FROM tickets t
            JOIN show_batch b ON t.batch_id = b.id
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud   h ON e.hud_id   = h.id
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