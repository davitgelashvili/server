'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [[client]] = await pool.query('SELECT id FROM clients WHERE id = ?', [id]);
        if (!client) return res.status(404).json({ success: false, message: 'Client not found' });

        await pool.query(`
            DELETE t FROM tickets t
            JOIN show_event e ON e.id = t.event_id
            JOIN show_hud h ON h.id = e.hud_id
            WHERE h.user_id = ?
        `, [id]);
        await pool.query(`
            DELETE b FROM show_batch b
            JOIN show_event e ON e.id = b.event_id
            JOIN show_hud h ON h.id = e.hud_id
            WHERE h.user_id = ?
        `, [id]);
        await pool.query(`
            DELETE e FROM show_event e
            JOIN show_hud h ON h.id = e.hud_id
            WHERE h.user_id = ?
        `, [id]);
        await pool.query('DELETE FROM show_hud WHERE user_id = ?', [id]);
        await pool.query('DELETE FROM clients WHERE id = ?', [id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
