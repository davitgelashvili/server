'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { id } = req.params;

        if (!id) return res.status(400).json({ success: false, message: 'Batch id is required' });

        // Batch-ის და Event-ის შემოწმება, რომ current user-ისაა
        const [rows] = await pool.query(`
            SELECT b.id
            FROM show_batch b
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud h ON e.hud_id = h.id
            WHERE b.id = ? AND h.user_id = ?
        `, [id, userId]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: 'Batch not found or access denied' });
        }

        await pool.query('DELETE FROM show_batch WHERE id = ?', [id]);

        res.json({ success: true, message: 'Batch deleted successfully' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
