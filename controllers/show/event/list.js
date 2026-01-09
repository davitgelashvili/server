'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { hud_id } = req.query;

        let sql = `
            SELECT e.*
            FROM show_event e
            JOIN show_hud h ON e.hud_id = h.id
            WHERE h.user_id = ?
        `;
        const params = [userId];

        if (hud_id) {
            sql += ' AND e.hud_id = ?';
            params.push(hud_id);
        }

        sql += ' ORDER BY e.start_datetime ASC';

        const [rows] = await pool.query(sql, params);

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
