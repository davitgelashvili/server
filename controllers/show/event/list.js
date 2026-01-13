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
            SELECT e.*
            FROM show_event e
            WHERE e.hud_id = ?
              AND EXISTS (
                  SELECT 1
                  FROM show_hud h
                  WHERE h.id = ?
                    AND h.user_id = ?
              )
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
