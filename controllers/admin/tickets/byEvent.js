'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { event_id } = req.params;
        const { status, search, page = 1, limit = 50 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const conds = ['t.event_id = ?'];
        const params = [event_id];

        if (status) { conds.push('t.status = ?'); params.push(status); }
        if (search)  { conds.push('(t.ticket_id LIKE ? OR t.buyer_id LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

        const where = `WHERE ${conds.join(' AND ')}`;

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM tickets t ${where}`, params
        );

        const [rows] = await pool.query(`
            SELECT
                t.id, t.ticket_id, t.status, t.sold_at, t.platform, t.buyer_id,
                b.name  AS batch_name,
                b.price AS batch_price
            FROM tickets t
            JOIN show_batch b ON t.batch_id = b.id
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
