'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM tickets WHERE buyer_id = ?', [id]);
        await pool.query('DELETE FROM buyers WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
