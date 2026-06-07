'use strict';

const { pool } = require('../../../db');

module.exports = {
    async get(req, res) {
        try {
            const { userId } = req.user;

            // Total HUDs
            const [hudResult] = await pool.query(
                'SELECT COUNT(*) as total FROM show_hud WHERE user_id = ?',
                [userId]
            );

            // Total Events
            const [eventResult] = await pool.query(
                'SELECT COUNT(*) as total FROM show_event WHERE hud_id IN (SELECT id FROM show_hud WHERE user_id = ?)',
                [userId]
            );

            // Total Batches
            const [batchResult] = await pool.query(
                'SELECT COUNT(*) as total FROM show_batch WHERE event_id IN (SELECT id FROM show_event WHERE hud_id IN (SELECT id FROM show_hud WHERE user_id = ?))',
                [userId]
            );

            // Total Tickets Sold
            const [ticketResult] = await pool.query(
                'SELECT COUNT(*) as total FROM tickets WHERE event_id IN (SELECT id FROM show_event WHERE hud_id IN (SELECT id FROM show_hud WHERE user_id = ?))',
                [userId]
            );

            // Total Revenue
            const [revenueResult] = await pool.query(
                'SELECT SUM(t.amount * b.price) as total FROM tickets t JOIN show_batch b ON t.batch_id = b.id WHERE t.event_id IN (SELECT id FROM show_event WHERE hud_id IN (SELECT id FROM show_hud WHERE user_id = ?))',
                [userId]
            );

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
            `, [userId]);

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
                WHERE h.user_id = ?
                GROUP BY h.id, h.title
                ORDER BY revenue DESC
            `, [userId]);

            res.json({
                success: true,
                stats: {
                    totalHuds: hudResult[0].total,
                    totalEvents: eventResult[0].total,
                    totalBatches: batchResult[0].total,
                    totalTickets: ticketResult[0].total,
                    totalRevenue: revenueResult[0].total || 0
                },
                recentTickets,
                revenueByHud,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({
                success: false,
                message: 'Server error'
            });
        }
    }
};