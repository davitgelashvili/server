'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // from auth middleware
        const { id } = req.params;

        const [rows] = await pool.query(
            `SELECT h.id, h.title, h.slug, h.description, h.cover, h.start_datetime, h.end_datetime,
                    h.requires_verification, h.max_tickets_per_buyer, h.created_at, h.updated_at,
                    (SELECT MIN(b.price) FROM show_batch b JOIN show_event e ON e.id=b.event_id
                     WHERE e.hud_id=h.id AND e.start_datetime=(SELECT MIN(start_datetime) FROM show_event WHERE hud_id=h.id)
                    ) AS first_day_min_price,
                    (SELECT MAX(b.price) FROM show_batch b JOIN show_event e ON e.id=b.event_id
                     WHERE e.hud_id=h.id AND e.start_datetime=(SELECT MAX(start_datetime) FROM show_event WHERE hud_id=h.id)
                    ) AS last_day_max_price
             FROM show_hud h
             WHERE h.id = ? AND h.user_id = ?`,
            [id, userId]
        );

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'HUD not found' });
        }

        const hud = rows[0];

        res.json({
            success: true,
            hud: {
                ...hud,
                description: hud.description || '',
                slug: hud.slug || null,
                cover: hud.cover || null,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
