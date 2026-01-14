'use strict';

const { pool } = require('../../../db');
const { generateBatchId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { event_id, name, price, capacity } = req.body;

        if (!event_id || !name || price == null || capacity == null) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // შემოწმება Event-ის არსებობისთვის და რომ current user–ის HUD–შია
        const [eventRows] = await pool.query(`
            SELECT e.id
            FROM show_event e
            JOIN show_hud h ON e.hud_id = h.id
            WHERE e.id = ? AND h.user_id = ?
        `, [event_id, userId]);

        if (!eventRows.length) {
            return res.status(404).json({ success: false, message: 'Event not found or access denied' });
        }

        const id = generateBatchId();

        const sql = `
            INSERT INTO show_batch
                (id, event_id, name, price, capacity, sold_count, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())
        `;

        await pool.query(sql, [id, event_id, name, price, capacity]);

        res.json({
            success: true,
            id,
            message: 'Batch created successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
