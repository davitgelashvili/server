'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await pool.query('SELECT * FROM show_event WHERE id = ?', [id]);

        if (!rows.length) return res.status(404).json({ success: false, message: 'Event not found' });

        res.json({ success: true, event: { ...rows[0], description: rows[0].description || '' } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
