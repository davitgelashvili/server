'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;

        const [rows] = await pool.query(
            `
      SELECT 
          h.id,
          h.title,
          h.slug,
          h.description,
          h.cover,
          h.start_datetime,
          h.end_datetime,
          DATEDIFF(h.end_datetime, h.start_datetime) + 1 AS duration_days,
          COUNT(t.id) AS ticket_count
      FROM show_hud h
      LEFT JOIN show_event e ON e.hud_id = h.id
      LEFT JOIN show_batch b ON b.event_id = e.id
      LEFT JOIN tickets t ON t.batch_id = b.id
      WHERE h.user_id = ?
      GROUP BY h.id
      `,
            [userId]
        );

        res.json({
            success: true,
            items: rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
