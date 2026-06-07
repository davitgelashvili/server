'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query('SELECT hud_id FROM show_event WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found' });

        const hud_id = rows[0].hud_id;

        await pool.query('DELETE FROM tickets WHERE event_id = ?', [id]);
        await pool.query('DELETE FROM show_batch WHERE event_id = ?', [id]);
        await pool.query('DELETE FROM show_event WHERE id = ?', [id]);

        await pool.query(
            `UPDATE show_hud
             SET start_datetime = (SELECT MIN(start_datetime) FROM show_event WHERE hud_id = ?),
                 end_datetime   = (SELECT MAX(start_datetime) FROM show_event WHERE hud_id = ?)
             WHERE id = ?`,
            [hud_id, hud_id, hud_id]
        );

        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
