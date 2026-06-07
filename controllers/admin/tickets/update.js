'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, buyer_id } = req.body;

        const [rows] = await pool.query('SELECT ticket_id FROM tickets WHERE ticket_id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Ticket not found' });

        await pool.query('UPDATE tickets SET status=?, buyer_id=? WHERE ticket_id=?', [status, buyer_id, id]);

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
