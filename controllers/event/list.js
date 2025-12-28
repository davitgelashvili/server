'use strict';

const { pool } = require('../../db');

async function list(req, res) {
    try {
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
      ORDER BY start_at DESC`
        );

        return res.json({ success: true, events: rows });
    } catch (e) {
        return res.status(500).json({ success: false });
    }
}

module.exports = list;
