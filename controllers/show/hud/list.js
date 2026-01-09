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
                created_at
            FROM show_hud
            WHERE user_id = ?
            ORDER BY created_at DESC
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
