'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const [huds] = await pool.query(`
            SELECT
                id,
                title,
                slug,
                description,
                cover
            FROM client_huds
            WHERE is_active = 1
            ORDER BY created_at DESC
        `);

        res.json({
            success: true,
            huds
        });
    } catch (err) {
        console.error('CLIENT HUD LIST ERROR:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load HUDs'
        });
    }
};
