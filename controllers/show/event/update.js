'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { title, description, start_datetime, end_datetime, min_price, max_price } = req.body;

        // Ownership check
        const [rows] = await pool.query(
            `SELECT e.hud_id
             FROM show_event e
             JOIN show_hud h ON e.hud_id = h.id
             WHERE e.id = ? AND h.user_id = ?`,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Event not found or not owned by user' });
        }

        const hud_id = rows[0].hud_id;

        // Update Event
        await pool.query(
            `UPDATE show_event
             SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, min_price = ?, max_price = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                title || null,
                description || null,
                start_datetime || null,
                end_datetime || null,
                min_price != null ? min_price : null,
                max_price != null ? max_price : null,
                id
            ]
        );

        // HUD-ის start/end განახლება (end = ბოლო Event-ის start_datetime)
        await pool.query(
            `UPDATE show_hud
             SET start_datetime = (
                 SELECT MIN(start_datetime) FROM show_event WHERE hud_id = ?
             ),
                 end_datetime = (
                 SELECT MAX(start_datetime) FROM show_event WHERE hud_id = ?
             )
             WHERE id = ?`,
            [hud_id, hud_id, hud_id]
        );

        res.json({
            success: true,
            message: 'Event updated successfully and HUD dates updated'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
