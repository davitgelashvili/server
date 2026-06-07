'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const [[{ totalUsers }]]   = await pool.query('SELECT COUNT(*) AS totalUsers FROM clients');
        const [[{ totalHuds }]]    = await pool.query('SELECT COUNT(*) AS totalHuds FROM show_hud');
        const [[{ totalEvents }]]  = await pool.query('SELECT COUNT(*) AS totalEvents FROM show_event');
        const [[{ totalBatches }]] = await pool.query('SELECT COUNT(*) AS totalBatches FROM show_batch');
        const [[{ totalTickets }]] = await pool.query('SELECT COUNT(*) AS totalTickets FROM tickets');
        const [[{ totalRevenue }]] = await pool.query(`
            SELECT COALESCE(SUM(b.price), 0) AS totalRevenue
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
        `);

        const [recentTickets] = await pool.query(`
            SELECT
                t.ticket_id, t.status, t.sold_at, t.platform,
                b.name  AS batch_name,
                b.price AS batch_price,
                e.title AS event_title,
                h.title AS hud_title,
                u.fullname AS owner_name
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            JOIN show_event e ON e.id = b.event_id
            JOIN show_hud   h ON h.id = e.hud_id
            LEFT JOIN clients u ON u.id = h.user_id
            ORDER BY t.sold_at DESC
            LIMIT 10
        `);

        const [revenueByHud] = await pool.query(`
            SELECT
                h.id,
                h.title,
                COUNT(t.ticket_id)        AS ticket_count,
                COALESCE(SUM(b.price), 0) AS revenue
            FROM show_hud h
            LEFT JOIN show_event  e ON e.hud_id   = h.id
            LEFT JOIN show_batch  b ON b.event_id = e.id
            LEFT JOIN tickets     t ON t.batch_id = b.id
            GROUP BY h.id, h.title
            ORDER BY revenue DESC
            LIMIT 10
        `);

        const [dailySales] = await pool.query(`
            SELECT
                DATE(t.sold_at)           AS day,
                COUNT(*)                  AS tickets,
                COALESCE(SUM(b.price), 0) AS revenue
            FROM tickets t
            JOIN show_batch b ON b.id = t.batch_id
            WHERE t.sold_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
            GROUP BY day
            ORDER BY day ASC
        `);

        res.json({
            success: true,
            stats: { totalUsers, totalHuds, totalEvents, totalBatches, totalTickets, totalRevenue },
            recentTickets,
            revenueByHud,
            dailySales,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
