'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, capacity, is_active } = req.body;

        const [[batch]] = await pool.query('SELECT * FROM show_batch WHERE id = ?', [id]);
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

        // თუ ეს კალათა ჩაირთვება — დანარჩენები გამოირთოს
        if (is_active === 1 || is_active === true || is_active === '1') {
            await pool.query(
                'UPDATE show_batch SET is_active = 0 WHERE event_id = ? AND id != ?',
                [batch.event_id, id]
            );
        }

        await pool.query(
            `UPDATE show_batch SET name=?, price=?, capacity=?, is_active=?, updated_at=NOW() WHERE id=?`,
            [
                name     ?? batch.name,
                price    != null ? price    : batch.price,
                capacity != null ? capacity : batch.capacity,
                is_active != null ? (is_active ? 1 : 0) : batch.is_active,
                id
            ]
        );

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
