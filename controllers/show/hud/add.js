'use strict';

const { pool } = require('../../../db');
const { generateHudId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { title, slug, description, cover, requires_verification, max_tickets_per_buyer } = req.body;
        const { userId } = req.user;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        const id = generateHudId();

        await pool.query(
            `INSERT INTO show_hud (id, user_id, title, slug, description, cover, status, requires_verification, max_tickets_per_buyer, start_datetime, end_datetime)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, NULL)`,
            [id, userId, title, slug || null, description || null, cover || null, requires_verification ? 1 : 0, max_tickets_per_buyer || null]
        );

        res.json({
            success: true,
            hud: {
                id,
                title,
                slug: slug || null,
                description: description || '',
                cover: cover || null,
                start_datetime: null,
                end_datetime: null,
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
