'use strict';

const { pool } = require('../../../db');
const { generateEventId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { hud_id, title, description, start_datetime, end_datetime, min_price, max_price } = req.body;

        if (!hud_id || !start_datetime || !end_datetime || min_price == null || max_price == null) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // ✅ HUD ownership check
        const [hudRows] = await pool.query(
            `SELECT title, description FROM show_hud WHERE id = ? AND user_id = ?`,
            [hud_id, userId]
        );

        if (!hudRows.length) {
            return res.status(404).json({ success: false, message: 'HUD not found or not owned by user' });
        }

        const hud = hudRows[0];

        const id = generateEventId();
        const eventTitle = title || hud.title;
        const eventDescription = description || hud.description;

        await pool.query(
            `INSERT INTO show_event 
             (id, hud_id, title, description, start_datetime, end_datetime, min_price, max_price, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, hud_id, eventTitle, eventDescription, start_datetime, end_datetime, min_price, max_price]
        );

        res.json({
            success: true,
            event: {
                id,
                hud_id,
                title: eventTitle,
                description: eventDescription,
                start_datetime,
                end_datetime,
                min_price,
                max_price,
            },
            message: 'Event created successfully',
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
