'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { id } = req.params;
        const { name, price, capacity, is_active } = req.body;

        if (!id) return res.status(400).json({ success: false, message: 'Batch id is required' });

        // Batch-ის შემოწმება, რომ current user-ის event/HUD-ზეა
        const [rows] = await pool.query(`
            SELECT b.*
            FROM show_batch b
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud h ON e.hud_id = h.id
            WHERE b.id = ? AND h.user_id = ?
        `, [id, userId]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Batch not found or access denied' });
        }

        const batch = rows[0];

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

        res.json({ success: true, message: 'Batch updated successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
