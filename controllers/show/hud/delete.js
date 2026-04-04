'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { id } = req.params;

        const [hudRows] = await pool.query(
            'SELECT id FROM show_hud WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (!hudRows.length) {
            return res.status(404).json({ success: false, message: 'HUD not found or not owned by user' });
        }

        await pool.query('DELETE FROM tickets WHERE event_id IN (SELECT id FROM show_event WHERE hud_id = ?)', [id]);
        await pool.query('DELETE FROM show_batch WHERE event_id IN (SELECT id FROM show_event WHERE hud_id = ?)', [id]);
        await pool.query('DELETE FROM show_event WHERE hud_id = ?', [id]);
        await pool.query('DELETE FROM show_hud WHERE id = ? AND user_id = ?', [id, userId]);

        res.json({ success: true, message: 'HUD deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
