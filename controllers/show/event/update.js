'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { title, description, start_datetime, end_datetime, min_price, max_price } = req.body;

        // ✅ Event ownership check
        const [rows] = await pool.query(
            `
            SELECT e.*, h.user_id
            FROM show_event e
            JOIN show_hud h ON e.hud_id = h.id
            WHERE e.id = ? AND h.user_id = ?
            `,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Event not found or not owned by user' });
        }

        const event = rows[0];

        const [result] = await pool.query(
            `
            UPDATE show_event
            SET title = ?, description = ?, start_datetime = ?, end_datetime = ?, min_price = ?, max_price = ?, updated_at = NOW()
            WHERE id = ?
            `,
            [
                title || event.title,
                description || event.description,
                start_datetime || event.start_datetime,
                end_datetime || event.end_datetime,
                min_price != null ? min_price : event.min_price,
                max_price != null ? max_price : event.max_price,
                id
            ]
        );

        res.json({
            success: true,
            event: {
                id,
                hud_id: event.hud_id,
                title: title || event.title,
                description: description || event.description || '',
                start_datetime: start_datetime || event.start_datetime,
                end_datetime: end_datetime || event.end_datetime,
                min_price: min_price != null ? min_price : event.min_price,
                max_price: max_price != null ? max_price : event.max_price,
            },
            message: 'Event updated successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
