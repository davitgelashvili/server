'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                h.id,
                h.title,
                h.description,
                h.cover,
                h.created_at
            FROM show_hud h
            WHERE h.is_public = 1
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
