'use strict';

const { pool } = require('../../db');

module.exports = async (req, res) => {
    try {
        const { hudId, userId } = req.query;
        if (!hudId || !userId)
            return res.status(400).json({ success: false, message: 'hudId and userId required' });

        const [[ver]] = await pool.query(
            'SELECT id, status FROM verifications WHERE hud_id = ? AND buyer_id = ?',
            [hudId, userId]
        );

        res.json({ success: true, verification: ver || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
