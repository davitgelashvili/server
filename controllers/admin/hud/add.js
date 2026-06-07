'use strict';

const { pool } = require('../../../db');
const { generateHudId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { user_id, title, slug, description, cover, requires_verification, max_tickets_per_buyer } = req.body;

        if (!user_id) return res.status(400).json({ success: false, message: 'user_id is required' });
        if (!title)   return res.status(400).json({ success: false, message: 'Title is required' });

        const [[clientRow]] = await pool.query('SELECT id FROM clients WHERE id = ?', [user_id]);
        if (!clientRow) return res.status(404).json({ success: false, message: 'Client not found' });

        const id = generateHudId();

        await pool.query(
            `INSERT INTO show_hud (id, user_id, title, slug, description, cover, status, requires_verification, max_tickets_per_buyer, start_datetime, end_datetime)
             VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, NULL, NULL)`,
            [id, user_id, title, slug || null, description || null, cover || null, requires_verification ? 1 : 0, max_tickets_per_buyer || null]
        );

        res.json({ success: true, hud: { id, title } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
