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

            res.json({
                success: true,
                stats: {
                    totalHuds: hudResult[0].total,
                    totalEvents: eventResult[0].total,
                    totalBatches: batchResult[0].total,
                    totalTickets: ticketResult[0].total,
                    totalRevenue: revenueResult[0].total || 0
                }
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