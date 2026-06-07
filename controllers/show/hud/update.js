'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;
        const { title, slug, description, cover, requires_verification, max_tickets_per_buyer } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Title is required' });
        }

        const [result] = await pool.query(
            `UPDATE show_hud
             SET title=?, slug=?, description=?, cover=?, requires_verification=?, max_tickets_per_buyer=?
             WHERE id=? AND user_id=?`,
            [title, slug || null, description || null, cover || null,
             requires_verification ? 1 : 0,
             max_tickets_per_buyer ? parseInt(max_tickets_per_buyer) : null,
             id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'HUD not found or not owned by user' });
        }

        res.json({
            success: true,
            hud: { id, title, slug: slug || null, description: description || '', cover: cover || null }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
