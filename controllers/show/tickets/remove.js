'use strict';

const { pool } = require('../../../db');

module.exports = async (req, res) => {
    try {
        const { event_id } = req.params;
        const { ticket_id } = req.body;

        if (!ticket_id || !event_id) {
            return res.status(400).json({ success: false, message: 'ticket_id and event_id are required' });
        }

        // Get ticket info
        const [ticketRows] = await pool.query('SELECT * FROM tickets WHERE ticket_id = ? AND event_id = ?', [ticket_id, event_id]);

        if (!ticketRows.length) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        const ticket = ticketRows[0];
        const amount = ticket.amount || 1;

        // Delete ticket
        await pool.query('DELETE FROM tickets WHERE ticket_id = ?', [ticket_id]);

        // Update sold_count
        await pool.query('UPDATE show_batch SET sold_count = sold_count - ? WHERE id = ?', [amount, ticket.batch_id]);

        res.json({
            success: true,
            message: 'Ticket refunded successfully'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};