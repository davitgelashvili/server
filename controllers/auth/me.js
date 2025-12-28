'use strict';

const { pool } = require('../../db');

async function me(req, res) {
    try {
        const { userId } = req.user;

        const [rows] = await pool.execute(
            `SELECT 
         user_id AS userId,
         email,
         fullname,
         link,
         cover,
         created_at
       FROM users
       WHERE user_id = ?
       LIMIT 1`,
            [userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        return res.json({
            success: true,
            user: rows[0]
        });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = me;
