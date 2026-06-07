'use strict';

const { pool } = require('../../../db');
const { generateTicketId } = require('../../../utils/generateId');
const checkBuyerEligibility = require('../../../utils/checkBuyerEligibility');
const activateNextBatch     = require('../../../utils/activateNextBatch');
const { broadcast }         = require('../../../utils/ws');

module.exports = async (req, res) => {
    try {
        const { userId } = req.user;
        const { buyer_name, status, buyer_id, batch_id, event_id, hud_id } = req.body;
        const amount = Math.max(1, Math.min(10, parseInt(req.body.amount) || 1));

        if (!buyer_name || !status || !buyer_id || !batch_id || !event_id || !hud_id) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

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

        if (sold_count + amount > capacity) {
            return res.status(400).json({ success: false, message: `არ არის საკმარისი ბილეთი (ხელმისაწვდომია: ${capacity - sold_count})` });
        }

        const eligibility = await checkBuyerEligibility(buyer_id, hud_id);
        if (!eligibility.ok)
            return res.status(eligibility.status).json({ success: false, message: eligibility.message });

        const soldAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const ticketIds = [];

        for (let i = 0; i < amount; i++) {
            const ticketId = generateTicketId();
            ticketIds.push(ticketId);
            await pool.query(`
                INSERT INTO tickets (ticket_id, event_id, buyer_id, status, amount, sold_at, platform, batch_id)
                VALUES (?, ?, ?, ?, 1, ?, 'manual', ?)
            `, [ticketId, event_id, buyer_id, status, soldAt, batch_id]);
        }

        await pool.query('UPDATE show_batch SET sold_count = sold_count + ? WHERE id = ?', [amount, batch_id]);

        broadcast({ type: 'batch_update', batch_id, sold_count: sold_count + amount, capacity });

        await activateNextBatch(batch_id);

        res.json({ success: true, ticket_ids: ticketIds, ticket_id: ticketIds[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
