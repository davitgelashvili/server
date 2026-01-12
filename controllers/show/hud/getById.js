'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // from auth middleware
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT id, title, slug, description, cover, start_datetime, end_datetime, created_at, updated_at
             FROM show_hud
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'HUD not found' });
        }

        const hud = rows[0];

        res.json({
            success: true,
            hud: {
                id: hud.id,
                title: hud.title,
                slug: hud.slug || null,
                description: hud.description || '',
                cover: hud.cover || null,
                start_datetime: hud.start_datetime,
                end_datetime: hud.end_datetime,
                created_at: hud.created_at,
                updated_at: hud.updated_at
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
