'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { id } = req.params;
        const { name, price, capacity } = req.body;

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
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
