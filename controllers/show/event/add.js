'use strict';

const { pool } = require('../../../db');
const { generateEventId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { hud_id, title, description, start_datetime, end_datetime, min_price, max_price } = req.body;

        if (!hud_id || !title || !start_datetime || !end_datetime) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const id = generateEventId();

        // Event insert
        await pool.query(
            `INSERT INTO show_event
             (id, hud_id, title, description, start_datetime, end_datetime, min_price, max_price, status, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
            [id, hud_id, title, description || '', start_datetime, end_datetime, min_price || 0, max_price || 0]
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
            event: { id, hud_id, title, description, start_datetime, end_datetime, min_price, max_price },
            message: 'Event created successfully and HUD dates updated'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
