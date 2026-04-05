'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან

        // Get all tickets for the user's HUDs
        const [rows] = await pool.query(`
            SELECT t.*
            FROM tickets t
            JOIN show_batch b ON t.batch_id = b.id
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud h ON e.hud_id = h.id
            WHERE h.user_id = ?
            ORDER BY t.sold_at DESC
        `, [userId]);

        res.json({
            success: true,
            tickets: rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};