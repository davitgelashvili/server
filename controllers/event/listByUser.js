'use strict';

const { pool } = require('../../db');

async function listByUser(req, res) {
    try {
        const { userId } = req.params;

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
      WHERE owner_user_id = ?
      ORDER BY start_at DESC`,
            [userId]
        );

        return res.json({ success: true, events: rows });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
}

module.exports = listByUser;
