'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { status, hud_id } = req.query;
        const conditions = [];
        const params = [];

        if (status)  { conditions.push('v.status = ?');  params.push(status); }
        if (hud_id)  { conditions.push('v.hud_id = ?');  params.push(hud_id); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                v.id, v.status, v.notes, v.created_at, v.updated_at,
                v.buyer_id,
                b.name        AS buyer_name,
                b.personal_id AS buyer_personal_id,
                b.phone       AS buyer_phone,
                b.email       AS buyer_email,
                h.id          AS hud_id,
                h.title       AS hud_title,
                u.fullname    AS owner_name
            FROM verifications v
            LEFT JOIN buyers   b ON b.id = v.buyer_id
            LEFT JOIN show_hud h ON h.id = v.hud_id
            LEFT JOIN clients  u ON u.id = h.user_id
            ${where}
            ORDER BY v.created_at DESC
        `, params);

        res.json({ success: true, verifications: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
