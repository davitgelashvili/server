'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: 'Batch id is required' });

        const [rows] = await pool.query('SELECT * FROM show_batch WHERE id = ?', [id]);
        if (!rows.length) return res.status(404).json({ success: false, message: 'Batch not found' });

        const b = rows[0];
        res.json({ success: true, batch: { id: b.id, name: b.name, price: b.price, capacity: b.capacity, sold_count: b.sold_count, is_active: b.is_active, event_id: b.event_id, created_at: b.created_at, updated_at: b.updated_at } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
