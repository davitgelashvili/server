'use strict';

const { pool } = require('../../../db');
const { generateTicketId } = require('../../../utils/generateId');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user; // auth middleware–დან
        const { buyer_name, status, buyer_id, batch_id, event_id, hud_id } = req.body;

        if (!buyer_name || !status || !buyer_id || !batch_id || !event_id || !hud_id) {
            return res.status(400).json({ success: false, message: 'Required fields missing: buyer_name, status, buyer_id, batch_id, event_id, hud_id' });
        }

        // Ownership check: batch უნდა იყოს current user-ის HUD/Event-ში
        const [batchRows] = await pool.query(`
            SELECT b.id, b.capacity, b.sold_count
            FROM show_batch b
            JOIN show_event e ON b.event_id = e.id
            JOIN show_hud h ON e.hud_id = h.id
            WHERE b.id = ? AND e.id = ? AND h.id = ? AND h.user_id = ?
        `, [batch_id, event_id, hud_id, userId]);

        if (!batchRows.length) {
            return res.status(404).json({ success: false, message: 'Batch not found or access denied' });
        }

        const { capacity, sold_count } = batchRows[0];

        if (sold_count + 1 > capacity) {
            return res.status(400).json({ success: false, message: 'Not enough tickets available' });
        }

        // Generate ticket_id
        const ticketId = generateTicketId();

        const soldAt = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // Insert ticket
        await pool.query(`
            INSERT INTO tickets (ticket_id, event_id, buyer_id, status, amount, sold_at, platform, batch_id)
            VALUES (?, ?, ?, ?, 1, ?, 'manual', ?)
        `, [ticketId, event_id, buyer_id, status, soldAt, batch_id]);

        // Update sold_count
        await pool.query('UPDATE show_batch SET sold_count = sold_count + 1 WHERE id = ?', [batch_id]);

        res.json({
            success: true,
            ticket_id: ticketId,
            message: 'Ticket issued successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};