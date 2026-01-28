'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                h.id,
                h.user_id,
                h.title,
                h.slug,
                h.description,
                h.cover,
                h.start_datetime,
                h.end_datetime,
                h.created_at
            FROM show_hud h
            ORDER BY h.created_at DESC
        `);

        res.json({
            success: true,
            data: rows
        });
    } catch (err) {
        console.error('HUD LIST EXPORT ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch huds'
        });
    }
};
