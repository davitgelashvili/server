'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const [rows] = await pool.query(
            `
            SELECT e.*
            FROM show_event e
            JOIN show_hud h ON e.hud_id = h.id
            WHERE e.id = ? AND h.user_id = ?
            `,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Event not found or not owned by user' });
        }

        res.json({
            success: true,
            event: {
                ...rows[0],
                description: rows[0].description || ''
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
