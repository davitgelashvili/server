'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { event_id, id } = req.params;

        if (!event_id || !id) {
            return res.status(400).json({ success: false, message: 'event_id and ticket id are required' });
        }

        const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ? AND event_id = ?', [id, event_id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        res.json({
            success: true,
            ticket: rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};