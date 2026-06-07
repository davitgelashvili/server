'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query('SELECT ticket_id, batch_id FROM tickets WHERE ticket_id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });

        await pool.query('DELETE FROM tickets WHERE ticket_id = ?', [id]);
        await pool.query('UPDATE show_batch SET sold_count = sold_count - 1 WHERE id = ? AND sold_count > 0', [rows[0].batch_id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
