'use strict';

const { pool } = require('../../db');

async function view(req, res) {
    try {
        const { eventId } = req.params;

        const [rows] = await pool.execute(
            `SELECT
        event_id,
        owner_user_id,
        title,
        description,
        location,
        start_at,
        end_at,
        cover,
        status
      FROM events
      WHERE event_id = ?
      LIMIT 1`,
            [eventId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false });
        }

        return res.json({ success: true, event: rows[0] });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
}

module.exports = view;
