'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at, t.buyer_id, t.platform,
                b.name  AS batch_name,
                b.price AS batch_price,
                e.title AS event_title,
                e.start_datetime AS event_date,
                h.title AS hud_title
            FROM tickets t
            JOIN show_batch b ON t.batch_id = b.id
            JOIN show_event e ON t.event_id = e.id
            JOIN show_hud   h ON e.hud_id   = h.id
            WHERE t.ticket_id = ?
        `, [id]);

        if (!rows.length)
            return res.status(404).json({ success: false, message: 'ბილეთი ვერ მოიძებნა' });

        const ticket = rows[0];

        // mark as validated (handles both 'valid' and 'active' statuses)
        if (ticket.status === 'valid' || ticket.status === 'active') {
            await pool.query(
                'UPDATE tickets SET status = ? WHERE ticket_id = ?',
                ['validated', id]
            );
            ticket.status = 'validated';
        }

        // if buyer is a test user, fetch their details
        let buyer = null;
        if (ticket.buyer_id?.startsWith('tu_')) {
            const [[testUser]] = await pool.query(
                'SELECT name, personal_id, is_valid, coins FROM test_users WHERE id = ?',
                [ticket.buyer_id]
            );
            if (testUser) buyer = testUser;
        }

        res.json({ success: true, ticket, buyer });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
