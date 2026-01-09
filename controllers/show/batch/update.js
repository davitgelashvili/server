'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, capacity } = req.body;

        const [rows] = await pool.query('SELECT * FROM show_batch WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, error: 'Batch not found' });

        const batch = rows[0];

        const sql = `
      UPDATE show_batch
      SET name = ?, price = ?, capacity = ?, updated_at = NOW()
      WHERE id = ?
    `;

        await pool.query(sql, [
            name || batch.name,
            price != null ? price : batch.price,
            capacity != null ? capacity : batch.capacity,
            id
        ]);

        res.json({ success: true, message: 'Batch updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
