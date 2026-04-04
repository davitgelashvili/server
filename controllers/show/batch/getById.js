'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: 'Batch id is required' });

        // Batch-ის და Event-ის შემოწმება, რომ current user-ისაა
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

        res.json({
            success: true,
            batch: {
                id: rows[0].id,
                name: rows[0].name,
                price: rows[0].price,
                capacity: rows[0].capacity,
                sold_count: rows[0].sold_count,
                event_id: rows[0].event_id,
                created_at: rows[0].created_at,
                updated_at: rows[0].updated_at
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};