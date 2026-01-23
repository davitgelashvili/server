'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { slug } = req.params;

        // 1️⃣ HUD
        const [[hud]] = await pool.query(`
            SELECT
                id,
                title,
                slug,
                description,
                cover
            FROM client_huds
            WHERE slug = ?
            LIMIT 1
        `, [slug]);

        if (!hud) {
            return res.status(404).json({
                success: false,
                message: 'HUD not found'
            });
        }

        // 2️⃣ EVENTS (days)
        const [events] = await pool.query(`
            SELECT
                id,
                title,
                start_datetime,
                end_datetime
            FROM client_events
            WHERE hud_id = ?
            ORDER BY start_datetime ASC
        `, [hud.id]);

        res.json({
            success: true,
            hud,
            events
        });
    } catch (err) {
        console.error('CLIENT HUD DETAIL ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load HUD detail'
        });
    }
};
