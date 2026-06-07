'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: 'Batch id is required' });

        const [rows] = await pool.query('SELECT id FROM show_batch WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Batch not found' });

        await pool.query('DELETE FROM show_batch WHERE id = ?', [id]);

        res.json({ success: true, message: 'Batch deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
