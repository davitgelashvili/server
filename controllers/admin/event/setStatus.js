'use strict';

const { pool } = require('../../../db');

const VALID = ['pending', 'published', 'rejected', 'archived'];

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID.includes(status))
            return res.status(400).json({ success: false, message: `status must be one of: ${VALID.join(', ')}` });

        const [result] = await pool.query(
            'UPDATE show_event SET status = ? WHERE id = ?',
            [status, id]
        );

        if (!result.affectedRows)
            return res.status(404).json({ success: false, message: 'Event not found' });

        res.json({ success: true, status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
