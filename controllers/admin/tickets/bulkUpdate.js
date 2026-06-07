'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { ids, status } = req.body;

        if (!Array.isArray(ids) || !ids.length || !status) {
            return res.status(400).json({ success: false, message: 'ids[] და status აუცილებელია' });
        }

        const allowed = ['valid', 'used', 'cancelled', 'validated'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: 'დაუშვებელი სტატუსი' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await pool.query(
            `UPDATE tickets SET status = ? WHERE ticket_id IN (${placeholders})`,
            [status, ...ids]
        );

        res.json({ success: true, updated: ids.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
