'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;

        const [rows] = await pool.query(
            `
      SELECT 
          id,
          title,
          slug,
          description,
          cover,
          start_datetime,
          end_datetime,
          DATEDIFF(end_datetime, start_datetime) + 1 AS duration_days
      FROM show_hud
      WHERE user_id = ?
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
