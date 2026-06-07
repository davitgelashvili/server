'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!['verified', 'rejected', 'pending'].includes(status))
            return res.status(400).json({ success: false, message: 'Invalid status' });

        const [result] = await pool.query(
            'UPDATE verifications SET status = ?, notes = ? WHERE id = ?',
            [status, notes || null, id]
        );

        if (!result.affectedRows)
            return res.status(404).json({ success: false, message: 'Not found' });

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
