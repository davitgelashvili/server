'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // from auth middleware
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT id, title, slug, description, cover, created_at
             FROM show_hud
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'HUD not found' });
        }

        res.json({
            success: true,
            hud: {
                ...rows[0],
                description: rows[0].description || '',
                cover: rows[0].cover || null
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
