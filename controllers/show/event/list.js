'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id: hudId } = req.params;

        if (!hudId) {
            return res.status(400).json({
                success: false,
                message: 'HUD id is required'
            });
        }

        const sql = `
            SELECT e.*,
                COUNT(DISTINCT b.id) AS batch_count,
                MIN(b.price)         AS min_price,
                MAX(b.price)         AS max_price
            FROM show_event e
            LEFT JOIN show_batch b ON b.event_id = e.id
            WHERE e.hud_id = ?
              AND EXISTS (
                  SELECT 1
                  FROM show_hud h
                  WHERE h.id = ?
                    AND h.user_id = ?
              )
            GROUP BY e.id
            ORDER BY e.start_datetime ASC
        `;

        const [rows] = await pool.query(sql, [hudId, hudId, userId]);

        res.json({
            success: true,
            events: rows.map(row => ({
                ...row,
                description: row.description || ''
            }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
